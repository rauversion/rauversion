module Products
  class GearController < BaseController
    def index
      @profile = User.find_by(username: params[:user_id])
      @q = @profile.products.merge(Products::GearProduct.all).active
                   .includes(:user).ransack(params[:q])
      @products = @q.result(distinct: true).order(created_at: :desc)
      
      @products = @products.by_category(params[:gear_category]) if params[:gear_category].present?
      @products = @products.where(condition: params[:condition]) if params[:condition].present?
      @products = @products.where(brand: params[:brand]) if params[:brand].present?
      @products = @products.where(accept_barter: true) if params[:barter_only].present?
      
      @products = @products.page(params[:page]).per(20)
      @available_brands = Products::GearProduct.distinct.pluck(:brand).compact
    end

    def new
      @product = Products::GearProduct.new(user: current_user)
      @product.accept_barter = true
      @product.condition = 'good'
    end

    def create
      @product = Products::GearProduct.new(product_params)
      @product.user = current_user

      if @product.save
        redirect_to user_product_path(current_user.username, @product), 
                    notice: 'Gear product was successfully created.'
      else
        render :new
      end
    end

    def edit
    end

    def update
      if @product.update(product_params)
        redirect_to user_product_path(current_user.username, @product), 
                    notice: 'Gear product was successfully updated.'
      else
        render :edit
      end
    end
  end
end
