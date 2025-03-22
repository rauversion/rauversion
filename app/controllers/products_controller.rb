class ProductsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show, :used_gear]
  before_action :set_product, only: [:edit, :update, :destroy]
  before_action :authorize_user, only: [:edit, :update, :destroy]

  def index
    @profile = User.find_by(username: params[:id] || params[:user_id])

    @q = @profile.products
    .active.includes(:user, :album, product_images: {image_attachment: :blob}) 
                 # .where.not(category: ['instrument', 'audio_gear', 'dj_gear', 'accessories'])
                 .ransack(params[:q])
    @products = @q.result(distinct: true).order(created_at: :desc)

    @products = @products.by_category(params[:category]) if params[:category].present?
    @available_brands = Products::GearProduct.distinct.pluck(:brand).compact
    @products = @products.page(params[:page]).per(20) # Assuming you're using Kaminari for pagination
    respond_to do |format| 
      format.html { render_blank }
      format.json { render 'index' }
    end
  end

  def used_gear
    @profile = User.find_by(username: params[:id] || params[:user_id])
    
    @q = if @profile
           @profile.products.merge(Products::GearProduct.used_gear).active
         else
           Products::GearProduct.used_gear.active
         end

    @q = @q.includes(:user).ransack(params[:q])
    @products = @q.result(distinct: true).order(created_at: :desc)
    
    @products = @products.by_category(params[:gear_category]) if params[:gear_category].present?
    @products = @products.where(condition: params[:condition]) if params[:condition].present?
    @products = @products.where(brand: params[:brand]) if params[:brand].present?
    @products = @products.where(accept_barter: true) if params[:barter_only].present?
    
    @products = @products.page(params[:page]).per(20)
    
    @available_brands = Products::GearProduct.distinct.pluck(:brand).compact
    
    render 'used_gear'
  end

  def show
    #@profile = User.find_by(username: params[:user_id])
    #@product = @profile.products.friendly.find(params[:id])
    @product = Product.friendly.find(params[:id])
    @product_variants = @product.product_variants



    view_path = case @product.type
    when "Products::GearProduct" then "products/gear/show"
    when "Products::MusicProduct" then "products/music/show"
    when "Products::MerchProduct" then "products/merch/show"
    when "Products::AccessoryProduct" then "products/accessory/show"
    when "Products::ServiceProduct" then "products/service/show"
    else
      "products/show"
    end

    respond_to do |format|  
      format.html { }
      format.json { render view_path and return } 
    end
    
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
    product_class = case params[:product_type]
                   when 'used_gear'
                     Products::GearProduct
                   when 'music'
                     Products::MusicProduct
                   when 'merch'
                     Products::MerchProduct
                   when 'accessory'
                     Products::AccessoryProduct
                   else
                     Product
                   end

    @product = product_class.new(user: current_user)
    
    if params[:product_type] == 'used_gear'
      @product.category = params[:gear_category] if product_class.categories.key?(params[:gear_category])
      @product.condition = 'good'
      @product.accept_barter = true
    end
  end

  def create
    product_class = determine_product_class(product_params[:category])
    @product = product_class.new(product_params)
    @product.user = current_user

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
    respond_to do |format|
      format.html { render html: "", layout: "react" }
    end
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
    respond_to do |format|
      format.html { redirect_to products_url, notice: 'Product was successfully deleted.' }
      format.json { render json: { success: true } }
    end
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

  def determine_product_class(category)
    case category
    when 'merch'
      Products::MerchProduct
    when 'vinyl', 'cassette', 'cd'
      Products::MusicProduct
    when 'instrument', 'audio_gear', 'dj_gear'
      Products::GearProduct
    when 'accessories'
      Products::AccessoryProduct
    else
      Product
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
