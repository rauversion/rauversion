class StoreController < ApplicationController
  def index
    @products = Product.all.page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json
    end
  end

  def services
    @products = Product.where(type: 'Products::ServiceProduct').page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json { render :index }
    end
  end

  def music
    @products = Product.where(type: 'Products::MusicProduct')
    @products = @products.where(category: params[:subcategory]) if params[:subcategory].present?
    @products = @products.page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json { render :index }
    end
  end

  def classes
    @products = Product.where(type: 'Products::ServiceProduct').page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json { render :index }
    end
  end

  def feedback
    @products = Product.where(type: 'Products::ServiceProduct').page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json { render :index }
    end
  end

  def accessories
    @products = Product.where(type: 'Products::AccessoryProduct').page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json { render :index }
    end
  end

  def gear
    @products = Product.where(type: 'Products::GearProduct').page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json { render :index }
    end
  end
end
