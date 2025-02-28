module Products
  class MerchController < BaseController
    def index
      @profile = User.find_by(username: params[:user_id])
      @q = @profile.products.merge(Products::MerchProduct.all).active
                   .includes(:user).ransack(params[:q])
      @products = @q.result(distinct: true).order(created_at: :desc)
      @products = @products.page(params[:page]).per(20)
    end

    def new
      @product = Products::MerchProduct.new(user: current_user)
    end

    def create
      @product = Products::MerchProduct.new(product_params)
      @product.user = current_user

      if params[:changed_form]
        render "create", status: :unprocessable_entity and return
      end

      respond_to do |format|
        format.html { 
          if @product.save
            redirect_to user_product_path(current_user.username, @product), 
            notice: 'Merch product was successfully created.'
          else
            render "create", status: :unprocessable_entity and return
          end
         }
        format.json { 
          if @product.save
            render "create", status: :created
          else
            render "create", status: :unprocessable_entity and return
          end
         }
      end
      
    end

    def edit
    end

    def update
      @product.update(product_params)

      respond_to do |format|
        format.html { 
          if @product.errors.empty?
            redirect_to user_product_path(current_user.username, @product), 
              notice: 'Merch product was successfully updated.'
          else
            render :edit
          end
         }
        format.json { 
          if @product.errors.empty?
            render "create", status: :created
          else
            render "create", status: :unprocessable_entity and return
          end
         }
      end
    end

    def product_class
      Products::MerchProduct
    end
  end
end
