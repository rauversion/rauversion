module Products
  class BaseController < ApplicationController
    before_action :authenticate_user!, except: [:index, :show]
    before_action :set_product, only: [:edit, :update, :destroy]
    before_action :authorize_user, only: [:edit, :update, :destroy]

    private

    def set_product
      @product = current_user.products.friendly.find(params[:id])
    end

    def authorize_user
      unless @product.user == current_user || current_user.is_admin?
        redirect_to products_path, alert: 'You are not authorized to perform this action.'
      end
    end

    def find_product
      product_class.friendly.find(params[:id])
    end

    def product_params
      permitted = params.require(:product).permit(
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
        product_images_attributes: [:id, :title, :description, :image, :_destroy],
        product_shippings_attributes: [:id, :country, :base_cost, :additional_cost, :_destroy]
      )

      if permitted[:product_shippings_attributes].is_a?(Array)
        permitted[:product_shippings_attributes] = permitted[:product_shippings_attributes].reject { |attr| attr[:id].nil? }
      end

      permitted
    end
  end
end
