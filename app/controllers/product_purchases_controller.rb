class ProductPurchasesController < ApplicationController
  before_action :authenticate_user!

  def index
    @collection = current_user.product_purchases
    .order(created_at: :desc)
    .page(params[:page]).per(30)

    respond_to do |format|
      format.html
      format.json
    end
  end

  def show
    @purchase = current_user.product_purchases.find(params[:id])
  end
end
