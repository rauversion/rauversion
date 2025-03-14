# frozen_string_literal: true

class ProductCheckoutController < ApplicationController
  before_action :set_cart

  def create

    ActiveRecord::Base.transaction do
      @purchase = current_user.product_purchases.create(
        total_amount: @cart.total_price,
        status: :pending
      )

      provider = payment_provider.new(
        cart: @cart,
        user: current_user,
        purchase: @purchase
      )

      result = provider.create_checkout_session(promo_code: params[:promo_code])

      raise ActiveRecord::Rollback if result[:error].present?
      
      if result[:error].present?
        respond_to do |format|
          format.html { redirect_to "/product_cart", notice: result[:error] }
          format.json { render json: { error: result[:error] }, status: :unprocessable_entity }
        end
        return
      end
      
      respond_to do |format|
        format.html { redirect_to result[:checkout_url], allow_other_host: true }
        format.json { render json: { checkout_url: result[:checkout_url] } }
      end

    rescue => e
      respond_to do |format|
        format.html { redirect_to "/product_cart", notice: result[:error] }
        format.json { render json: { error: result[:error] }, status: :unprocessable_entity }
      end
    end
  end

  def success
    render "shared/blank"
  end

  def cancel
    render "shared/blank"
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

  def payment_provider
    provider = params[:provider] || ENV['DEFAULT_PAYMENT_GATEWAY'] || 'stripe'
    case provider
    when 'mercado_pago'
      PaymentProviders::MercadoPagoProvider
    else
      PaymentProviders::StripeProvider
    end
  end
end
