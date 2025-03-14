module PaymentProviders
  class StripeProvider < BaseProvider
    attr_reader :purchasable, :price_param

    def initialize(user:, purchasable: nil, price_param: nil, cart: nil, purchase: nil)
      @purchasable = purchasable
      @price_param = price_param
      super(user: user, cart: cart, purchase: purchase)
    end

    def create_checkout_session(promo_code: nil)
      return { error: "Cart is empty" } unless validate_cart!
      return { error: "Invalid promo code" } unless validate_promo_code!(promo_code)

      checkout_params = build_checkout_params(promo_code)

      begin
        session = Stripe::Checkout::Session.create(checkout_params)
        purchase.update(stripe_session_id: session.id)
        { checkout_url: session.url }
      rescue Stripe::InvalidRequestError => e
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
        account = purchasable.user.oauth_credentials.find_by(provider: "stripe_connect")
        Stripe.stripe_account = account.uid if account.present?

        checkout_params = build_digital_checkout_params(purchase, source_type, account)
        session = Stripe::Checkout::Session.create(checkout_params)
        
        purchase.update(
          checkout_type: "stripe",
          checkout_id: session.id
        )
        
        { checkout_url: session.url }
      rescue Stripe::InvalidRequestError => e
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

    def build_digital_checkout_params(purchase, source_type, account)
      params = {
        payment_method_types: ["card"],
        line_items: [{
          "quantity" => 1,
          "price_data" => {
            "unit_amount" => (purchase.price * 100).to_i,
            "currency" => "USD",
            "product_data" => {
              "name" => purchasable.title,
              "description" => "#{purchasable.title} from #{purchasable.user.username}"
            }
          }
        }],
        mode: "payment",
        success_url: success_url(purchase_id: purchase.id),
        cancel_url: cancel_url,
        client_reference_id: purchase.id.to_s,
        customer_email: user.email,
        tax_id_collection: {enabled: true},
        metadata: { 
          purchase_id: purchase.id,
          source_type: source_type
        }
      }

      if account
        params[:payment_intent_data] = {
          application_fee_amount: ENV.fetch('PLATFORM_EVENTS_FEE', 3).to_i
        }
      end

      params
    end

    def build_checkout_params(promo_code)
      params = {
        payment_method_types: ['card'],
        line_items: build_line_items,
        mode: 'payment',
        success_url: success_url(purchase_id: purchase.id),
        cancel_url: cancel_url,
        client_reference_id: cart.id.to_s,
        customer_email: user.email,
        tax_id_collection: { enabled: true },
        metadata: { 
          purchase_id: purchase.id,
          cart_id: cart.id,
          source_type: "product"
        },
        shipping_address_collection: {
          allowed_countries: shipping_countries
        },
        phone_number_collection: {
          enabled: true
        },
        shipping_options: generate_shipping_options
      }

      if promo_code.present?
        params.merge!(discounts: [{ coupon: promo_code }])
      end

      params
    end

    def build_line_items
      cart.product_cart_items.includes(:product).map do |item|
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.product.title,
            },
            unit_amount: (item.product.price * 100).to_i,
          },
          quantity: item.quantity,
        }
      end
    end

    def shipping_countries
      cart.product_cart_items.map(&:product).flat_map do |product|
        product.product_shippings.pluck(:country)
      end.uniq
    end

    def generate_shipping_options
      shipping_options = []
      
      cart.product_cart_items.map(&:product).each do |product|
        product.product_shippings.each do |shipping|
          option = {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: {
                amount: (shipping.base_cost * 100).to_i,
                currency: 'usd',
              },
              display_name: "Shipping to #{shipping.country}",
              delivery_estimate: {
                minimum: {
                  unit: 'business_day',
                  value: 5,
                },
                maximum: {
                  unit: 'business_day',
                  value: 10,
                },
              },
            },
          }
          shipping_options << option unless shipping_options.any? { |o| o[:shipping_rate_data][:display_name] == option[:shipping_rate_data][:display_name] }
        end
      end

      shipping_options
    end
  end
end
