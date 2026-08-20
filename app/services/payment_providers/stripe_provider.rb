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
      return { error: "Cart contains products with multiple currencies" } unless validate_single_currency!
      return { error: "Invalid promo code" } unless validate_promo_code!(promo_code)

      purchase.update(currency: cart_currency) if purchase.respond_to?(:currency=)
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
        }],
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
        # Assuming ENV['PLATFORM_EVENTS_FEE'] is a percentage, e.g., 10 for 10%
        fee_percentage = ENV.fetch('PLATFORM_EVENTS_FEE', 10).to_f / 100.0
        fee_amount = stripe_amount(purchase.price * fee_percentage, currency)
    
        #params[:payment_intent_data] = {
        #  application_fee_amount: fee_amount,
          #transfer_data: {
          #  destination: account # this is the connected account ID (acct_XXXX)
          #}
        #}

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
      # TODO: handle multiple connected user products in cart
      connected_accounts = cart.products.map{|o| o.user.stripe_account_id}
      connected_account_id = connected_accounts.first
      currency = cart_currency

      #return render json: {
      #  error: "Multiple connected accounts not supported"
      #}, status: 422 if connected_accounts.size > 1

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
    
      if connected_account_id.present?
        fee_percentage = ENV.fetch('PLATFORM_EVENTS_FEE', 10).to_f / 100.0
        fee_amount = stripe_amount(cart.total_price * fee_percentage, currency)
    
        params[:payment_intent_data] = {
          application_fee_amount: fee_amount,
          transfer_data: {
            destination: connected_account_id
          }
        }
      end
    
      params
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

    def shipping_countries
      cart.product_cart_items.map(&:product).flat_map do |product|
        product.product_shippings.pluck(:country)
      end.uniq
    end

    def generate_shipping_options
      # Aggregate shipping costs per country
      country_shipping_totals = {}
      currency = cart_currency

      cart.product_cart_items.each do |item|
        product = item.product
        quantity = item.quantity

        product.product_shippings.each do |shipping|
          country = shipping.country
          base_cost = shipping.base_cost.to_f
          additional_cost = shipping.additional_cost.to_f

          # Calculate shipping for this product/quantity
          total_cost = if quantity > 1
            base_cost + (quantity - 1) * additional_cost
          else
            base_cost
          end

          total_cost_amount = stripe_amount(total_cost, currency)

          # Aggregate per country
          if country_shipping_totals[country]
            country_shipping_totals[country][:amount] += total_cost_amount
          else
            country_shipping_totals[country] = {
              amount: total_cost_amount,
              delivery_estimate: {
                minimum: { unit: 'business_day', value: 5 },
                maximum: { unit: 'business_day', value: 10 }
              }
            }
          end
        end
      end

      # Build Stripe shipping options
      shipping_options = country_shipping_totals.map do |country, data|
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: data[:amount],
              currency: currency
            },
            display_name: "Shipping to #{country}",
            delivery_estimate: data[:delivery_estimate]
          }
        }
      end

      shipping_options
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
