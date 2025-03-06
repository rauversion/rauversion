# app/controllers/product_cart_controller.rb
class ProductCartController < ApplicationController
  include ApplicationHelper # This gives us access to the current_cart method
  before_action :set_cart

  def add
    product = Product.find_by(id: params[:product_id])
    @cart.add_product(product)
    @cart_items = @cart.product_cart_items.includes(:product)
    # redirect_back(fallback_location: root_path, notice: 'Item added to cart')
  
    respond_to do |format|
      format.html { render "destroy" }
      format.json { render "show" }
    end
  end

  def show
    render json: {} and return if @cart.blank?
    @cart_items = @cart.product_cart_items.includes(
      product: {
        product_images: {image_attachment: :blob}
      }
    )
    respond_to do |format|
      format.html
      format.json 
    end
  end

  def remove
    item = @cart.product_cart_items.find_by(product_id: params[:product_id])
    item.destroy if item
    @cart_items = @cart.product_cart_items.includes(:product)
    
    respond_to do |format|
      format.html { render "destroy" }
      format.json { render "show" }
    end
    
    # redirect_to( product_cart_path, notice: 'Item removed from cart')
  end

  private

  def set_cart
    @cart = current_cart
    if @cart.blank? && request.format.html?
      redirect_to root_path, notice: "Log in first to access your cart" and return
    end
  end
end