module PaymentProviders
  class StripeProvider < BaseProvider
    class InvalidFeeConfiguration < StandardError; end
    class InvalidShippingSelection < StandardError; end

    attr_reader :purchasable, :price_param, :shipping_country

    def initialize(user:, purchasable: nil, price_param: nil, cart: nil, purchase: nil, shipping_country: nil, delivery_method: nil)
      @purchasable = purchasable
      @price_param = price_param
      @shipping_country = shipping_country.to_s.upcase.presence
      super(user: user, cart: cart, purchase: purchase, delivery_method: delivery_method)
    end

    def create_checkout_session(promo_code: nil)
      return { error: "Cart is empty" } unless validate_cart!
      return { error: "Cart contains products with multiple currencies" } unless validate_single_currency!
      return { error: "Invalid promo code" } unless validate_promo_code!(promo_code)
      return { error: "Products must belong to a single connected Stripe seller" } unless validate_single_seller!
      delivery_error = delivery_selection_error
      return { error: delivery_error } if delivery_error

      begin
        checkout_params = build_checkout_params(promo_code)
        purchase.update!(currency: cart_currency, delivery_method: delivery_method)
        client = Stripe::StripeClient.new(api_key: ENV["STRIPE_CLIENT_SECRET"])
        session, = client.request { Stripe::Checkout::Session.create(checkout_params) }
        purchase.update(stripe_session_id: session.id)
        { checkout_url: session.url }
      rescue Stripe::InvalidRequestError, InvalidFeeConfiguration, InvalidShippingSelection, StripeProcessingFeeEstimate::InvalidConfiguration => e
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
      purchase = create_purchase(final_price, purchasable_currency)
      
      begin
        account = purchasable.user.stripe_account_id # oauth_credentials.find_by(provider: "stripe_connect")
        # Stripe.stripe_account = account if account.present?

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

    def create_purchase(final_price, currency)
      purchase = user.purchases.new(purchasable: purchasable, price: final_price, currency: currency)
      purchase.virtual_purchased = [
        VirtualPurchasedItem.new({resource: purchasable, quantity: 1})
      ]
      purchase.store_items
      purchase.save
      purchase
    end

    def build_digital_checkout_params(purchase, source_type, account)
      purchasable = purchase.purchasable
      user = purchase.user
      currency = purchase.currency.presence || purchasable_currency
      fee_amount = stripe_amount(platform_fee_for(purchase.price), currency)
    
      params = {
        payment_method_types: ["card"],
        line_items: [{
          "quantity" => 1,
          "price_data" => {
            "unit_amount" => stripe_amount(purchase.price, currency),
            "currency" => currency,
            "product_data" => {
              "name" => purchasable.title,
              "description" => "#{purchasable.title} from #{purchasable.user.username}"
            }
          }
        }] + build_service_fee_line_items(fee_amount, currency, source_type),
        mode: "payment",
        success_url: success_url(purchase_id: purchase.id),
        cancel_url: cancel_url,
        client_reference_id: purchase.id.to_s,
        customer_email: user.email,
        tax_id_collection: { enabled: true },
        metadata: { 
          purchase_id: purchase.id,
          source_type: source_type
        }
      }
    
      if account
        params[:payment_intent_data] = {
          application_fee_amount: fee_amount,
          transfer_data: {
            destination: account
          }
        }
      end
    
      Rails.logger.info "Checkout params: #{params}"
      params
    end
    
    def build_checkout_params(promo_code)
      currency = cart_currency
      shipping_options = selected_shipping_options
      shipping_amount = shipping_options.first&.dig(:shipping_rate_data, :fixed_amount, :amount) || 0
      fee_amount = stripe_amount(cart.total_price.to_d * marketplace_fee_rate, currency)
      product_line_items = build_line_items
      subtotal = product_line_items.sum { |item| item[:price_data][:unit_amount] * item[:quantity] }
      estimated_total = discounted_checkout_total(subtotal + fee_amount, promo_code, currency) + shipping_amount
      processing_fee_amount = estimated_processing_fee(estimated_total, currency)
      application_fee_amount = [fee_amount + processing_fee_amount, estimated_total].min
      fee_metadata = {
        delivery_method: delivery_method,
        processing_fee_payer: "seller",
        processing_fee_model: "estimated",
        service_fee_amount: fee_amount,
        estimated_processing_fee_amount: processing_fee_amount,
        shipping_fee_amount: shipping_amount,
        processing_fee_base_amount: estimated_total
      }

      params = {
        line_items: product_line_items + build_service_fee_line_items(fee_amount, currency, "product"),
        payment_intent_data: {
          application_fee_amount: application_fee_amount,
          transfer_data: { destination: connected_account_id },
          metadata: {
            purchase_id: purchase.id,
            source_type: "product"
          }.merge(fee_metadata)
        },
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
        }.merge(fee_metadata),
        phone_number_collection: {
          enabled: true
        }
      }

      if shipping_options.any?
        params[:shipping_address_collection] = {
          allowed_countries: shipping_country.present? ? [shipping_country] : cart.shipping_costs_by_country.keys
        }
        params[:shipping_options] = shipping_options
      end
    
      if promo_code.present?
        params.merge!(discounts: [{ coupon: promo_code }])
      end
    
      params
    end

    def marketplace_fee_rate
      percentage = BigDecimal((ENV["PLATFORM_MARKETPLACE_FEE"].presence || "8").to_s)
      unless percentage.finite? && percentage >= 0 && percentage <= 100
        raise InvalidFeeConfiguration, "Invalid marketplace fee percentage"
      end

      percentage / 100
    rescue ArgumentError
      raise InvalidFeeConfiguration, "Invalid marketplace fee percentage"
    end

    def estimated_processing_fee(total, currency)
      StripeProcessingFeeEstimate.call(total: total, currency: currency, source: "product")
    end

    def discounted_checkout_total(total, promo_code, currency)
      return total if promo_code.blank?

      coupon = cart.products.first.coupon
      discount = if coupon.percentage?
        (total * coupon.discount_amount.to_d / 100).round.to_i
      elsif currency == "usd"
        stripe_amount(coupon.discount_amount, currency)
      else
        # Fixed-amount coupons currently use USD in Coupon#create_stripe_coupon.
        raise InvalidFeeConfiguration, "Fixed-amount product coupons require USD"
      end

      [total - discount, 0].max
    end

    def connected_accounts
      @connected_accounts ||= cart.products.includes(:user).map { |product| product.user.stripe_account_id }.uniq
    end

    def connected_account_id
      connected_accounts.first
    end

    def validate_single_seller!
      connected_accounts.one? && connected_account_id.present?
    end

    def build_service_fee_line_items(fee_amount, currency, source_type)
      return [] unless fee_amount.positive?

      [{
        "quantity" => 1,
        "price_data" => {
          "unit_amount" => fee_amount,
          "currency" => currency,
          "product_data" => {
            "name" => service_fee_name,
            "description" => service_fee_description(source_type)
          }
        }
      }]
    end
    

    def build_line_items
      cart.product_cart_items.includes(:product).map do |item|
        currency = product_currency(item.product)

        {
          price_data: {
            currency: currency,
            product_data: {
              name: item.product.title,
            },
            unit_amount: stripe_amount(item.product.price, currency),
          },
          quantity: item.quantity,
        }
      end
    end

    def selected_shipping_options
      return [] if delivery_method == "local_pickup"

      costs = cart.shipping_costs_by_country
      if shipping_country.present?
        unless costs.key?(shipping_country)
          raise InvalidShippingSelection, I18n.t("products.cart.shipping_unavailable")
        end
        costs = costs.slice(shipping_country)
      elsif costs.values.uniq.size > 1
        raise InvalidShippingSelection, I18n.t("products.cart.choose_shipping_country")
      end

      costs.map do |country, cost|
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: stripe_amount(cost, cart_currency),
              currency: cart_currency
            },
            display_name: "Shipping to #{country}",
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 10 }
            }
          }
        }
      end
    end

    def validate_single_currency!
      cart_currencies.one?
    end

    def cart_currencies
      @cart_currencies ||= cart.product_cart_items.includes(:product).map { |item| product_currency(item.product) }.uniq
    end

    def cart_currency
      cart_currencies.first.presence || "usd"
    end

    def product_currency(product)
      return product.normalized_currency if product.respond_to?(:normalized_currency)

      product.currency.to_s.downcase.presence || "usd"
    end

    def purchasable_currency
      return purchasable.normalized_currency if purchasable.respond_to?(:normalized_currency)
      return purchasable.currency.to_s.downcase if purchasable.respond_to?(:currency) && purchasable.currency.present?

      "usd"
    end

    def stripe_amount(value, currency)
      multiplier = zero_decimal_currency?(currency) ? 1 : 100
      (BigDecimal(value.to_s) * multiplier).round.to_i
    end

    def zero_decimal_currency?(currency)
      %w[bif clp djf gnf jpy kmf krw mga pyg rwf ugx vnd vuv xaf xof xpf].include?(currency.to_s.downcase)
    end
  end
end
