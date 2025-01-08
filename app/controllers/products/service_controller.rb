module Products
  class ServiceController < BaseController
    def index
      @products = product_class.where(user_id: @user.id)
    end

    def new
      @product = product_class.new
    end

    def create
      @product = product_class.new(product_params)
      @product.user = current_user

      if @product.save
        redirect_to user_products_service_path(current_user.username, @product),
                    notice: 'Service was successfully created.'
      else
        render :new, status: :unprocessable_entity
      end
    end

    def edit
      @product = find_product
    end

    def update
      @product = find_product

      if @product.update(product_params)
        redirect_to user_products_service_path(current_user.username, @product),
                    notice: 'Service was successfully updated.'
      else
        render :edit, status: :unprocessable_entity
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

    def find_product
      product_class.find(params[:id])
    end
  end
end
