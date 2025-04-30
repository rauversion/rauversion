class ProductImage < ApplicationRecord
  belongs_to :product
  has_one_attached :image


  def image_url(size = :medium)
    url = case size
    when :medium
      image.variant(resize_to_fill: [200, 200]) # &.processed&.url

    when :large
      image.variant(resize_to_fill: [500, 500]) # &.processed&.url

    when :small
      image.variant(resize_to_fill: [50, 50]) # &.processed&.url

    else
      image.variant(resize_to_fill: [200, 200]) # &.processed&.url
    end

    return Rails.application.routes.url_helpers.rails_storage_proxy_url(url) if url.present?

    AlbumsHelper.default_image_sqr
  end
end

