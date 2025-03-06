class StoreController < ApplicationController
  def index
    @products = Product.all.includes(
      product_images: {image_attachment: :blob}
    ).page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json
    end
  end

  def services
    @products = Product.where(type: 'Products::ServiceProduct')
    .includes(
      product_images: {image_attachment: :blob}
    )
    .page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json { render :index }
    end
  end

  def music
    @products = Product.where(type: 'Products::MusicProduct')
    .includes(
      product_images: {image_attachment: :blob}
    )
    @products = @products.where(category: params[:subcategory]) if params[:subcategory].present?
    @products = @products.page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json { render :index }
    end
  end

  def classes
    @products = Product.where(type: 'Products::ServiceProduct')
    .includes(
      product_images: {image_attachment: :blob}
    )
    .page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json { render :index }
    end
  end

  def feedback
    @products = Product.where(type: 'Products::ServiceProduct')
    .includes(
      product_images: {image_attachment: :blob}
    )
    .page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json { render :index }
    end
  end

  def accessories
    @products = Product.where(type: 'Products::AccessoryProduct')
    .includes(
      product_images: {image_attachment: :blob}
    )
    .page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json { render :index }
    end
  end

  def gear
    @products = Product.where(type: 'Products::GearProduct')
    .includes(
      product_images: {image_attachment: :blob}
    )
    .page(params[:page]).per(12)
    respond_to do |format|
      format.html
      format.json { render :index }
    end
  end
end
