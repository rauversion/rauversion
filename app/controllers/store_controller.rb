class StoreController < ApplicationController
  def index
    @products = Product.all
  end

  def services
    @products = Product.where(type: 'Products::ServiceProduct')
    render "products/service/index"
  end

  def music
    @products = Product.where(type: 'Products::MusicProduct')
    render :index
  end

  def accessories
    @products = Product.where(type: 'Products::AccessoryProduct')
    render :index
  end

  def gear
    @products = Product.where(type: 'Products::GearProduct')
    render :index
  end
end
