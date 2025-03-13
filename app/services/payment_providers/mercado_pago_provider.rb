module PaymentProviders
  class MercadoPagoProvider < BaseProvider
    attr_reader :purchasable, :price_param

    def initialize(user:, purchasable: nil, price_param: nil, cart: nil, purchase: nil)
      @purchasable = purchasable
      @price_param = price_param
      super(user: user, cart: cart, purchase: purchase)
    end

    def create_checkout_session(promo_code: nil)
      return { error: "Cart is empty" } unless validate_cart!
      return { error: "Invalid promo code" } unless validate_promo_code!(promo_code)

      begin
        preference_data = build_preference_data(promo_code)
        sdk = Mercadopago::SDK.new(ENV["MERCADO_PAGO_ACCESS_TOKEN"])
        preference_response = sdk.preference.create(preference_data)
        
        if preference_response[:status] == 201
          purchase.update(stripe_session_id: preference_response[:response]["id"])
          { checkout_url: preference_response[:response]["init_point"] }
        else
          { error: "Failed to create MercadoPago preference" }
        end
      rescue => e
        { error: e.message }
      end
    end

    def success_url(options = {})
      Rails.application.routes.url_helpers.checkout_success_url(options)
    end

    def cancel_url
      Rails.application.routes.url_helpers.checkout_failure_url
    end

    def create_digital_checkout_session(source_type:)
      return { error: "Invalid purchasable" } unless purchasable

      final_price = calculate_price
      purchase = create_purchase(final_price)
      
      begin
        account = purchasable.user.oauth_credentials.find_by(provider: "mercado_pago")

        preference_data = build_digital_preference_data(purchase, source_type, account)
        sdk = account ? 
          Mercadopago::SDK.new(account.token) : 
          Mercadopago::SDK.new(ENV["MERCADO_PAGO_ACCESS_TOKEN"])

        sdk = Mercadopago::SDK.new(ENV["MERCADO_PAGO_ACCESS_TOKEN"])

        preference_response = sdk.preference.create(preference_data)
        Rails.logger.info(preference_response)
        if preference_response[:status] == 201
          purchase.update(
            checkout_type: "mercado_pago",
            #stripe_session_id: preference_response[:response]["id"]
            checkout_id: preference_response[:response]["id"]
          )
          { checkout_url: preference_response[:response]["init_point"] 
           # or use preference_response[:response]["sandbox_init_point"]
          }
        else
          { error: "Failed to create MercadoPago preference" }
        end
      rescue => e
        { error: e.message }
      end
    end

    private

    def calculate_price
      base_price = purchasable.price
      return price_param if purchasable.name_your_price? && 
                          price_param && 
                          price_param > base_price
      base_price
    end

    def create_purchase(final_price)
      purchase = user.purchases.new(purchasable: purchasable, price: final_price)
      purchase.virtual_purchased = [
        VirtualPurchasedItem.new({resource: purchasable, quantity: 1})
      ]
      purchase.store_items
      purchase.save
      purchase
    end

    def build_digital_preference_data(purchase, source_type, account)

      options = {
        id: purchasable.id,
        category_id: "physical_goods",
        title: purchasable.title,
        quantity: 1,
        currency_id: "USD",
        unit_price: purchase.price.to_f,
        description: "#{purchasable.title} from #{purchasable.user.username}",
        #category_id: "digital_goods"
      }

      payload = {
        items: [options],
        payer: {
          email: Rails.env.development? ? "aaa-#{user.email}" : user.email,
          first_name: user.first_name || user.full_name,
          last_name: user.last_name || user.full_name,
          phone: {
            area_code: "",
            number: ""
          },
          address: {
            zip_code: "",
            street_name: "",
            street_number: nil
          }
        },
        back_urls: {
          success: success_url(purchase_id: purchase.id),
          failure: cancel_url,
          pending: cancel_url
        },
        notification_url: "#{Rails.env.development? ? 'https://chaskiq.sa.ngrok.io' : ENV['HOST']}/webhooks/mercadopago",
        auto_return: "approved",
        external_reference: purchase.id.to_s,
        metadata: { 
          purchase_id: purchase.id,
          source_type: source_type
        }
      }

      payload.merge!({
        # collector_id: 2326465448,
        # collector_id: account.token, # ID del vendedor en MercadoPago
        # application_fee: (purchasable.price * 0.05).round(2) # Comisión del marketplace (5% ejemplo)
      }) if account.present?

      payload
    end

    def build_preference_data(promo_code)
      {
        items: build_items,
        payer: {
          email: Rails.env.development? ? "aaa-#{user.email}" : user.email,
          phone: {
            area_code: "",
            number: ""
          },
          address: {
            zip_code: "",
            street_name: "",
            street_number: nil
          }
        },
        back_urls: {
          success: success_url(purchase_id: purchase.id),
          failure: cancel_url,
          pending: cancel_url
        },
        auto_return: "approved",
        external_reference: purchase.id.to_s,
        metadata: { 
          purchase_id: purchase.id,
          cart_id: cart.id,
          source_type: "product"
        }
      }
    end

    def build_items
      cart.product_cart_items.includes(:product).map do |item|
        {
          title: item.product.title,
          quantity: item.quantity,
          currency_id: "USD",
          unit_price: item.product.price.to_f,
          description: item.product.title,
          category_id: "physical_goods"
        }
      end
    end
  end
end
