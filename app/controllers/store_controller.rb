class StoreController < ApplicationController
  def index
    @products = Product.all.page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json
    end
  end

  def services
    @products = Product.where(category: 'service').page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json { render :index }
    end
  end

  def music
    @products = Product.where(category: 'music').page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json { render :index }
    end
  end

  def classes
    @products = Product.where(category: 'class').page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json { render :index }
    end
  end

  def feedback
    @products = Product.where(category: 'feedback').page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json { render :index }
    end
  end

  def accessories
    @products = Product.where(category: 'accessory').page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json { render :index }
    end
  end

  def gear
    @products = Product.where(category: 'gear')
    respond_to do |format|
      format.html
      format.json { render :index }
    end
  end
end
