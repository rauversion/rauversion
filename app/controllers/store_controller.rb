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
    scope = Product.visibles.where(type: 'Products::ServiceProduct')
    scope = scope.where(service_kind: params[:kind]) if params[:kind].present?
    scope = scope.where("products.data ->> 'delivery_method' = ?", params[:delivery]) if params[:delivery].present?

    @category_counts = category_counts_for(scope)

    @products = apply_category_filter(scope)
    .includes(
      product_images: {image_attachment: :blob}
    )
    @products = @products.page(params[:page]).per(12)
    respond_to do |format|
      format.html { render_blank }
      format.json { render :index }
    end
  end

  def performers
    scope = Product.visibles.where(type: 'Products::ServiceProduct', service_kind: "performance")
    scope = scope.where("products.data ->> 'delivery_method' = ?", params[:delivery]) if params[:delivery].present?

    @category_counts = category_counts_for(scope)

    @products = apply_category_filter(scope)
    .includes(
      product_images: {image_attachment: :blob}
    )
    @products = @products.page(params[:page]).per(12)

    respond_to do |format|
      format.html { render_blank }
      format.json { render :index }
    end
  end

  def music
    scope = Product.visibles.where(type: 'Products::MusicProduct')
    @category_counts = category_counts_for(scope)

    @products = apply_category_filter(scope)
    .includes(
      product_images: {image_attachment: :blob}
    )
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
    .where(service_kind: "education")
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
    .where(category: "feedback")
    .page(params[:page]).per(12)
    respond_to do |format|
      format.html { render_blank}
      format.json { render :index }
    end
  end

  def accessories
    scope = Product.visibles.where(type: 'Products::AccessoryProduct')
    @category_counts = category_counts_for(scope)

    @products = apply_category_filter(scope)
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
    scope = Product.visibles.where(type: 'Products::GearProduct')
    @category_counts = category_counts_for(scope)

    @products = apply_category_filter(scope)
    .includes(
      product_images: {image_attachment: :blob}
    )
    @products = @products.page(params[:page]).per(12)
    respond_to do |format|
      format.html { render_blank }
      format.json { render :index }
    end
  end

  def merch
    scope = Product.visibles.where(type: 'Products::MerchProduct')
    @category_counts = category_counts_for(scope)

    @products = apply_category_filter(scope)
    .includes(
      product_images: {image_attachment: :blob}
    )
    .page(params[:page]).per(12)
    respond_to do |format|
      format.html { render_blank }
      format.json { render :index }
    end
  end

  private

  def category_filter
    params[:category].presence || params[:subcategory].presence
  end

  def apply_category_filter(scope)
    return scope if category_filter.blank?

    scope.where(category: category_filter)
  end

  def category_counts_for(scope)
    counts = scope.reorder(nil).group(:category).count.transform_keys(&:to_s)
    counts.merge('all' => scope.reorder(nil).count)
  end
end
