module PaymentProviders
  class MercadoPagoProvider < BaseProvider
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

    private

    def build_preference_data(promo_code)
      {
        items: build_items,
        payer: {
          email: "aaaa" + user.email,
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
