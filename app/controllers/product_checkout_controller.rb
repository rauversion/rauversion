# app/controllers/product_checkout_controller.rb
class ProductCheckoutController < ApplicationController
  before_action :set_cart

  def create
    cart_items = @cart.product_cart_items.includes(:product).map do |item|
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

    @purchase = current_user.product_purchases.create(
      total_amount: @cart.total_price,
      status: :pending
    )

    shipping_countries = @cart.product_cart_items.map(&:product).flat_map do |product|
      product.product_shippings.pluck(:country)
    end.uniq

    checkout_params = {
      payment_method_types: ['card'],
      line_items: cart_items,
      mode: 'payment',
      success_url: success_url(purchase_id: @purchase.id),
      cancel_url: cancel_url,
      client_reference_id: @cart.id.to_s,
      customer_email: current_user.email,
      tax_id_collection: {enabled: true},
      metadata: { 
        purchase_id: @purchase.id,
        cart_id: @cart.id
      },
      shipping_address_collection: {
        allowed_countries: shipping_countries
      },
      phone_number_collection: {
        enabled: true
      },
      shipping_options: generate_shipping_options,
    }

    if params[:promo_code].present?
      checkout_params.merge!({discounts: [{ coupon: params[:promo_code] }]}) 

      @cart.product_cart_items.map(&:product).each do |product|
        redirect_to( "/product_cart", notice: "Invalid promo code") and return if product.coupon&.code != params[:promo_code]
      end
    end

    # allow_promotion_codes: @product&.coupon.exists?,  

    begin
    session = Stripe::Checkout::Session.create(checkout_params)
    rescue Stripe::InvalidRequestError => e
      redirect_to "/product_cart", notice: e 
      return
    end

    @purchase.update(stripe_session_id: session.id)
    redirect_to session.url, allow_other_host: true
  end

  def success
    @purchase = ProductPurchase.find(params[:purchase_id])
    
    if @purchase.pending?
      stripe_session = Stripe::Checkout::Session.retrieve(@purchase.stripe_session_id)
      
      if stripe_session.payment_status == 'paid'
        shipping_cost = stripe_session.shipping_cost.amount_total / 100.0 rescue 0
        total_amount = stripe_session.amount_total / 100.0
  
        payment_intent = Stripe::PaymentIntent.retrieve(stripe_session.payment_intent)

        @purchase.update(
          status: :completed,
          shipping_address: stripe_session&.shipping_details&.address&.to_h,
          shipping_name: stripe_session&.shipping_details&.name,
          phone: stripe_session&.customer_details&.phone,
          shipping_cost: shipping_cost,
          total_amount: total_amount,
          payment_intent_id: payment_intent["id"]
        )
        
        cart = ProductCart.find(stripe_session.metadata.cart_id)
        
        @purchase.product_purchase_items.create(cart.product_cart_items.map { |item|
          product = item.product
          shipping = nil
          additional_shipping_cost = 0
          if stripe_session.shipping_details.present?
            shipping = product.product_shippings.find_by(country: stripe_session.shipping_details.address.country) ||
                      product.product_shippings.find_by(country: 'Rest of World')
            
            additional_shipping_cost = shipping ? (item.quantity - 1) * shipping.additional_cost.to_i : 0
          end
          {
            product: product,
            quantity: item.quantity,
            price: product.price,
            shipping_cost: (shipping&.base_cost || 0) + additional_shipping_cost
          }
        })
  
        @purchase.product_purchase_items.each do |item|
          item.product.decrease_quantity(item.quantity, current_user) if item.quantity.positive?
        end
  
        ProductPurchaseMailer.purchase_confirmation(@purchase).deliver_later
  
        cart.product_cart_items.destroy_all
        
        redirect_to root_path, notice: 'Payment successful! Thank you for your purchase.'
      else
        @purchase.update(status: :failed)
        redirect_to product_cart_path, alert: 'Payment was not successful. Please try again.'
      end
    else
      redirect_to root_path, notice: 'This purchase has already been processed.'
    end
  end

  def cancel
    redirect_to product_cart_path, alert: 'Payment cancelled.'
  end

  private

  def set_cart
    @cart = current_cart
  end

  def current_cart
    ProductCart.find(session[:cart_id])
  rescue ActiveRecord::RecordNotFound
    cart = ProductCart.create(user: current_user)
    session[:cart_id] = cart.id
    cart
  end

  def success_url(options)
    success_product_checkout_index_url(options)
  end

  def cancel_url
    cancel_product_checkout_index_url
  end

  def generate_shipping_options
    shipping_options = []
    
    @cart.product_cart_items.map(&:product).each do |product|
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