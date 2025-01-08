module Products
  class AccessoryController < BaseController
    def index
      @profile = User.find_by(username: params[:user_id])
      @q = @profile.products.merge(Products::AccessoryProduct.all).active
                   .includes(:user).ransack(params[:q])
      @products = @q.result(distinct: true).order(created_at: :desc)
      @products = @products.page(params[:page]).per(20)
    end

    def new
      @product = Products::AccessoryProduct.new(user: current_user)
    end

    def create
      @product = Products::AccessoryProduct.new(product_params)
      @product.user = current_user

      if @product.save
        redirect_to user_product_path(current_user.username, @product), 
                    notice: 'Accessory product was successfully created.'
      else
        render :new
      end
    end

    def edit
    end

    def update
      if @product.update(product_params)
        redirect_to user_product_path(current_user.username, @product), 
                    notice: 'Accessory product was successfully updated.'
      else
        render :edit
      end
    end
  end
end
