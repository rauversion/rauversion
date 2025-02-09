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

    if cart_items.empty?
      respond_to do |format|
        format.html { redirect_to "/product_cart", notice: "Cart is empty" }
        format.json { render json: { error: "Cart is empty" }, status: :unprocessable_entity }
      end
      return
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
        cart_id: @cart.id,
        source_type: "product"
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
        if product.coupon&.code != params[:promo_code]
          respond_to do |format|
            format.html { redirect_to "/product_cart", notice: "Invalid promo code" }
            format.json { render json: { error: "Invalid promo code" }, status: :unprocessable_entity }
          end
          return
        end
      end
    end

    # allow_promotion_codes: @product&.coupon.exists?,  

    begin
    session = Stripe::Checkout::Session.create(checkout_params)
    rescue Stripe::InvalidRequestError => e
      respond_to do |format|
        format.html { redirect_to "/product_cart", notice: e }
        format.json { render json: { error: e.message }, status: :unprocessable_entity }
      end
      return
    end

    @purchase.update(stripe_session_id: session.id)
    
    respond_to do |format|
      format.html { redirect_to session.url, allow_other_host: true }
      format.json { render json: { checkout_url: session.url } }
    end
  end

  def success
    render "shared/blank"
    #redirect_to root_path, notice: 'Payment successful! Thank you for your purchase.'
  end

  def cancel
    render "shared/blank"
    #redirect_to product_cart_path, alert: 'Payment cancelled.'
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
    checkout_success_url(options)
  end

  def cancel_url
    checkout_failure_url
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