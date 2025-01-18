class StoreController < ApplicationController
  def index
    @products = Product.all
  end

  def services
    @products = Product.where(type: 'Products::ServiceProduct')
    @q = @products.active.includes(:user, :album)
    .where.not(category: Products::ServiceProduct.categories.keys)
    .ransack(params[:q])
    
    render "products/service/index"
  end

  def music
    @products = Product.where(type: 'Products::MusicProduct')

    @q = @products.active.includes(:user, :album)
    .where.not(category: Products::MusicProduct.categories.keys)
    .ransack(params[:q])
    @products = @q.result.page(params[:page]).per(20)

    render "products/music/index"
  end

  def accessories
    @products = Product.where(type: 'Products::AccessoryProduct')
    render :index
  end

  def gear
    @products = Product.where(type: 'Products::GearProduct')
    
    # @profile = User.find_by(username: params[:user_id])
    @q = @products
                 .includes(:user).ransack(params[:q])
    @products = @q.result(distinct: true).order(created_at: :desc)
    
    @products = @products.by_category(params[:gear_category]) if params[:gear_category].present?
    @products = @products.where(condition: params[:condition]) if params[:condition].present?
    @products = @products.where(brand: params[:brand]) if params[:brand].present?
    @products = @products.where(accept_barter: true) if params[:barter_only].present?
    
    @products = @products.page(params[:page]).per(20)
    @available_brands = Products::GearProduct.distinct.pluck(:brand).compact


    render "products/gear/index"

  end
end
