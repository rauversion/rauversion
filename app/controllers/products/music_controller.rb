module Products
  class MusicController < BaseController
    def index
      @profile = User.find_by(username: params[:user_id])
      @q = @profile.products.merge(Products::MusicProduct.all).active
                   .includes(:user, :album).ransack(params[:q])
      @products = @q.result(distinct: true).order(created_at: :desc)
      @products = @products.page(params[:page]).per(20)
    end

    def new
      @product = Products::MusicProduct.new(user: current_user)
    end

    def create
      @product = Products::MusicProduct.new(product_params)
      @product.user = current_user
      
      if params[:changed_form]
        render "create", status: :unprocessable_entity and return
      end

      if @product.save
        redirect_to user_product_path(current_user.username, @product), 
                    notice: 'Music product was successfully created.'
      else
        render "create", status: :unprocessable_entity and return
      end
    end

    def edit
    end

    def update
      if @product.update(product_params)
        redirect_to user_product_path(current_user.username, @product), 
                    notice: 'Music product was successfully updated.'
      else
        render :edit
      end
    end

    def product_class
      Products::MusicProduct
    end
  end
end