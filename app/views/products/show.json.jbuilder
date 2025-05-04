json.extract! @product, :type, :id, :title, :description, :price, :category, :slug

json.user do
  json.partial! 'users/user', user: @product.user, show_full_name: true
end if @product.user.present?

json.album do
  json.extract! @product.album, :id, :title, :slug
end if @product.album.present?

json.product_images @product.product_images do |product_image|
  json.id product_image.id
  json.image_url rails_blob_url(product_image.image)
  json.gallery_url user_product_path(@product.user.username, @product, image: product_image.id)
end

json.product_shippings @product.product_shippings do |product_shipping|
  json.id product_shipping.id
  json.country product_shipping.country
  json.base_cost number_to_currency(product_shipping.base_cost)
  json.additional_cost number_to_currency(product_shipping.additional_cost)
end
