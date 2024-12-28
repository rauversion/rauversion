class ProductsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show, :used_gear]
  before_action :set_product, only: [:edit, :update, :destroy]
  before_action :authorize_user, only: [:edit, :update, :destroy]

  def index
    @profile = User.find_by(username: params[:id] || params[:user_id])

    #@profile = User.find_by(username: params[:username]) || current_user
    @q = @profile.products.active.includes(:user, :album)
                 .where.not(category: ['instrument', 'audio_gear', 'dj_gear', 'accessories'])
                 .ransack(params[:q])
    @products = @q.result(distinct: true).order(created_at: :desc)

    #@products = @profile.products.active.includes(:user, :album).order(created_at: :desc)
    @products = @products.by_category(params[:category]) if params[:category].present?
    @products = @products.page(params[:page]).per(20) # Assuming you're using Kaminari for pagination
  end

  def used_gear
    @profile = User.find_by(username: params[:id] || params[:user_id])
    
    @q = if @profile
           @profile.products.used_gear.active
         else
           Product.used_gear.active
         end

    @q = @q.includes(:user).ransack(params[:q])
    @products = @q.result(distinct: true).order(created_at: :desc)
    
    # Filter by specific gear category if provided
    @products = @products.by_category(params[:gear_category]) if params[:gear_category].present?
    
    # Filter by condition
    @products = @products.where(condition: params[:condition]) if params[:condition].present?
    
    # Filter by brand
    @products = @products.where(brand: params[:brand]) if params[:brand].present?
    
    # Filter barter-only items
    @products = @products.accept_barter if params[:barter_only].present?
    
    @products = @products.page(params[:page]).per(20)
    
    # Get unique brands for filtering
    @available_brands = Product.used_gear.distinct.pluck(:brand).compact
    
    render 'used_gear'
  end

  def show
    @profile = User.find_by(username: params[:user_id])
    @product = @profile.products.friendly.find(params[:id])
    @product_variants = @product.product_variants
    
    if request.headers["Turbo-Frame"] == "gallery-photo"
      product_image = @product.product_images.find(params[:image])
      render turbo_stream: [
        turbo_stream.update(
          "gallery-photo",
          partial: "gallery_photo",
          locals: { image: product_image.image }
        )
      ] and return
    end
  end

  def new
    @product = current_user.products.new
    
    # Set default values for used gear if specified
    if params[:product_type] == 'used_gear'
      @product.category = params[:gear_category] if Product.categories.key?(params[:gear_category])
      @product.condition = 'good' # Default condition
      @product.accept_barter = true # Default to accepting barter
    end
  end

  def create
    @product = current_user.products.new(product_params)
    if params[:changed_form]
      render "create" and return
    end

    if @product.save
      redirect_to user_product_path(current_user.username, @product), notice: 'Product was successfully created.'
    else
      render "create"
    end
  end

  def edit
  end

  def update
    @product.assign_attributes(product_params)
    
    if params[:changed_form]
      render "update" and return
    end

    if @product.save
      redirect_to user_product_path(current_user.username, @product), notice: 'Product was successfully updated.'
    else
      render "update"
    end
  end

  def destroy
    @product.destroy
    redirect_to products_url, notice: 'Product was successfully deleted.'
  end

  private

  def set_product
    @product = current_user.products.friendly.find(params[:id])
  end

  def authorize_user
    unless @product.user == current_user || current_user.is_admin?
      redirect_to products_path, alert: 'You are not authorized to perform this action.'
    end
  end

  def product_params
    params.require(:product).permit(
      :title, :coupon_id,
      :limited_edition, :limited_edition_count, :include_digital_album, :visibility, 
      :name_your_price, :shipping_days, :shipping_begins_on, :shipping_within_country_price, 
      :shipping_worldwide_price, :quantity, :playlist_id,
      :title, :description, :price, :sku, :category, :status, :stock_quantity,
      :condition, :brand, :model, :year, :accept_barter, :barter_description,
      :limited_edition, :limited_edition_count, :include_digital_album,
      :visibility, :name_your_price, :shipping_days, :shipping_begins_on,
      :shipping_within_country_price, :shipping_worldwide_price, :quantity,
      :shipping_days,
      images: [], 
      product_variants_attributes: [:id, :name, :price, :stock_quantity, :_destroy],
      product_options_attributes: [:id, :name, :quantity, :sku, :_destroy],
      product_images_attributes: [:id, :name, :description, :image, :_destroy],
      product_shippings_attributes: [:id, :country, :base_cost, :additional_cost, :_destroy]
    )
  end
end