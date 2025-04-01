module Products
  class ServiceController < BaseController
    def index
      @user = User.find_by(username: params[:user_id])
      @profile = @user
      @products = product_class.where(user_id: @user.id)
    end

    def new
      @product = product_class.new
    end

    def create
      @product = product_class.new(product_params)
      @product.user = current_user
      # @product.category = 'service'

      if params[:changed_form]
        render "create", status: :unprocessable_entity and return
      end

      respond_to do |format|
        format.html { 
          if @product.save
            redirect_to user_product_path(current_user.username, @product), 
            notice: 'Service was successfully created.'
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
      @product = find_product
    end

    def update
      @product = find_product

      if @product.update(product_params)

        respond_to do |format|
          format.html {
            redirect_to user_products_service_path(current_user.username, @product),
                    notice: 'Service was successfully updated.'
          }
          format.json {
            render "create"
          }
        end
      else
        render :create, status: :unprocessable_entity
      end
    end

    def show
      @product = find_product
    end

    private

    def product_params
      params.require(:product).permit(
        :title, :description, :price, :category,
        :delivery_method, :duration_minutes, :max_participants,
        :prerequisites, :what_to_expect, :cancellation_policy,
        :name_your_price, :status, :coupon_id,
        :stock_quantity, :sku,
        product_images_attributes: [:id, :title, :description, :image, :_destroy]
      )
    end

    def product_class
      Products::ServiceProduct
    end
  end
end
