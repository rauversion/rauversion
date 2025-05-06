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
    @products = Product.visibles.where(type: 'Products::ServiceProduct')
    .includes(
      product_images: {image_attachment: :blob}
    )
    .page(params[:page]).per(12)
    respond_to do |format|
      format.html { render_blank }
      format.json { render :index }
    end
  end

  def music
    @products = Product.visibles.where(type: 'Products::MusicProduct')
    .includes(
      product_images: {image_attachment: :blob}
    )
    @products = @products.where(category: params[:subcategory]) if params[:subcategory].present?
    @products = @products.page(params[:page]).per(12)
    respond_to do |format|
      format.html {render_blank}
      format.json { render :index }
    end
  end

  def classes
    @products = Product.visibles.where(type: 'Products::ServiceProduct')
    .includes(
      product_images: {image_attachment: :blob}
    )
    .page(params[:page]).per(12)
    respond_to do |format|
      format.html { render_blank }
      format.json { render :index }
    end
  end

  def feedback
    @products = Product.visibles.where(type: 'Products::ServiceProduct')
    .includes(
      product_images: {image_attachment: :blob}
    )
    .page(params[:page]).per(12)
    respond_to do |format|
      format.html { render_blank}
      format.json { render :index }
    end
  end

  def accessories
    @products = Product.visibles.where(type: 'Products::AccessoryProduct')
    .includes(
      product_images: {image_attachment: :blob}
    )
    .page(params[:page]).per(12)
    respond_to do |format|
      format.html { render_blank}
      format.json { render :index }
    end
  end

  def gear
    @products = Product.visibles.where(type: 'Products::GearProduct')
    .includes(
      product_images: {image_attachment: :blob}
    )
    .page(params[:page]).per(12)
    respond_to do |format|
      format.html { render_blank }
      format.json { render :index }
    end
  end
end
