class PurchasesController < ApplicationController
  before_action :authenticate_user!

  def index
    @tab = params[:tab].present? ? params[:tab] : "music"
    
    case @tab
    when "music"
      @collection = current_user.purchases.includes(:purchased_items).where(purchasable_type: ["Track", "Album"]).page(params[:page]).per(20)
    when "tickets"
      @collection = current_user.purchases.includes(:purchased_items).where(purchasable_type: "EventTicket").page(params[:page]).per(20)
    when "products"
      @collection = current_user.purchases.includes(:purchased_items).where(purchasable_type: "Product").page(params[:page]).per(20)
    end

    respond_to do |format|
      format.html
      format.json
    end
  end

  def music
    @section = params[:section] || "all"
    @collection = current_user.purchases.includes(:purchased_items).where(purchasable_type: ["Track", "Album"]).page(params[:page]).per(20)

    respond_to do |format|
      format.html
      format.json
    end
  end

  def tickets
    @collection = current_user.purchases.includes(:purchased_items).where(purchasable_type: "EventTicket").page(params[:page]).per(20)

    respond_to do |format|
      format.html
      format.json
    end
  end

  def products
    @collection = current_user.purchases.includes(:purchased_items).where(purchasable_type: "Product").page(params[:page]).per(20)

    respond_to do |format|
      format.html
      format.json
    end
  end

  def download
    @purchase = Purchase.find(params[:id])
    
    if @purchase.purchasable.zip.attached?
      render turbo_stream: turbo_stream.replace(
        "purchase_#{@purchase.id}_download",
        partial: 'purchases/download_ready',
        locals: { purchase: @purchase }
      )
    else
      ZipperJob.perform_later(purchase_id: @purchase.id)
      render turbo_stream: turbo_stream.replace(
        "purchase_#{@purchase.id}_download",
        partial: 'purchases/download_processing',
        locals: { purchase: @purchase }
      )
    end
  end

  def check_zip_status
    @purchase = Purchase.find(params[:id])
    if @purchase.purchasable.zip.attached?
      render turbo_stream: turbo_stream.replace(
        "purchase_#{@purchase.id}_download",
        partial: 'purchases/download_ready',
        locals: { purchase: @purchase }
      )
    else
      head :no_content
    end
  end
end
