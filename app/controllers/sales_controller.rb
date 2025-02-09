class SalesController < ApplicationController
  before_action :authenticate_user!
  before_action :ensure_seller
  before_action :set_purchase, only: [:product_show, :update, :refund]

  def index
    @tab = params[:tab].present? ? params[:tab].singularize.capitalize : "Album"

    if @tab == "Product"
      @collection = ProductPurchase.for_seller(current_user)
                                .order(created_at: :desc)
                                .page(params[:page])
                                .per(20)
    else
      @collection = current_user.user_sales_for(@tab)
                              .page(params[:page])
                              .per(20)
    end

    respond_to do |format|
      format.html
      format.json
    end
  end

  def show
    unless @purchase.product_purchase_items.joins(:product).where(products: { user_id: current_user.seller_account_ids }).exists?
      redirect_to admin_product_purchases_path, alert: 'Access denied.'
    end
  end

  def product_show
    @product_item = ProductPurchase.for_seller(current_user).find_by(id: params[:id])
    @product = @product_item.products.first
    unless @product_item
      redirect_to sales_path, alert: 'Product not found in this purchase.'
    end
  end

  def update
    if @purchase.update(purchase_params)
      if @purchase.saved_change_to_shipping_status? || 
         @purchase.saved_change_to_tracking_code? || 
         @purchase.saved_change_to_status?
        ProductPurchaseMailer.status_update(@purchase).deliver_later 
      end
      respond_to do |format|
        format.html { redirect_to sales_path(tab: "Product"), notice: 'Purchase was successfully updated.' }
        format.json { render json: @purchase, status: :ok }
      end
    else
      respond_to do |format|
        format.html { redirect_to sales_path(tab: "Product"), alert: @purchase.errors.full_messages.join(", ") }
        format.json { render json: @purchase.errors, status: :unprocessable_entity }
      end
    end
  end

  def refund
    begin
      stripe_refund = Stripe::Refund.create({
        payment_intent: @purchase.payment_intent,
        amount: (params[:amount].to_f * 100).to_i
      })
      
      @purchase.update(refunded: true, refund_id: stripe_refund.id)
      respond_to do |format|
        format.html { redirect_to sales_path, notice: 'Refund was successfully processed.' }
        format.json { render json: @purchase, status: :ok }
      end
    rescue Stripe::StripeError => e
      respond_to do |format|
        format.html { redirect_to sales_path, alert: "Refund failed: #{e.message}" }
        format.json { render json: { error: "Refund failed: #{e.message}" }, status: :unprocessable_entity }
      end
    end
  end

  private

  def set_purchase
    @purchase = ProductPurchase.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to admin_product_purchases_path, alert: 'Purchase not found.'
  end

  def purchase_params
    params.require(:product_purchase).permit(:shipping_status, :tracking_code, :status)
  end

  def ensure_seller
    redirect_to root_path, alert: 'Access denied. Seller account required.' unless current_user.can_sell_products?
  end

end
