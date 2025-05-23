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

    def show
      @profile = User.find_by(username: params[:user_id])
      @product = @profile.products.merge(Products::GearProduct.all)
                        .includes(:product_images, :product_shippings)
                        .friendly.find(params[:id])
    end

    def new
      @product = Products::GearProduct.new(user: current_user)
      @product.accept_barter = true
      @product.condition = 'good'
    end

    def create
      @product = Products::GearProduct.new(product_params)
      @product.user = current_user

      if params[:changed_form]
        render "create", status: :unprocessable_entity and return
      end

      respond_to do |format|
        format.html { 
          if @product.save
            redirect_to user_product_path(current_user.username, @product), 
                        notice: 'Gear product was successfully created.'
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
          if @product.save
            redirect_to user_product_path(current_user.username, @product),
                      notice: 'Gear product was successfully updated.' 
          else
            render :edit
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

    def product_class
      Products::GearProduct
    end

    private

    def product_params
      permitted = params.require(:product).permit(
        :category, :brand, :model, :year, :condition, :title, :description,
        :accept_barter, :barter_description, :price, :stock_quantity, :sku,
        :status, :shipping_days, :shipping_begins_on, :visibility, :name_your_price, :quantity,
        product_images_attributes: [:id, :title, :description, :image, :_destroy],
        product_shippings_attributes: [:id, :country, :base_cost, :additional_cost, :_destroy]
      )

      #if permitted[:product_shippings_attributes].is_a?(Array)
      #  permitted[:product_shippings_attributes] = permitted[:product_shippings_attributes].reject { |attr| attr[:id].nil? }
      #end

      permitted
    end
  end
end
