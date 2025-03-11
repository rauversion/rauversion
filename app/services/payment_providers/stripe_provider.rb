module PaymentProviders
  class StripeProvider < BaseProvider
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

    private

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
