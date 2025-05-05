json.extract! @product, :type, :id, :title, :description, :price, :category, :slug

json.user do
  json.partial! 'users/user', user: @product.user, show_full_name: true
end if @product.user.present?

json.album do
  json.extract! @product.album, :id, :title, :slug
end if @product.album.present?

json.post_purchase_instructions @product.post_purchase_instructions if @product.respond_to?(:post_purchase_instructions)

json.sku @product.sku if @product.respond_to?(:sku)
json.stock_quantity @product.stock_quantity if @product.respond_to?(:stock_quantity)
json.status @product.status if @product.respond_to?(:status)
json.shipping_days @product.shipping_days if @product.respond_to?(:shipping_days)
json.accept_barter @product.accept_barter if @product.respond_to?(:accept_barter)
json.barter_description @product.barter_description if @product.accept_barter

json.formatted_price number_to_currency(@product.price) if @product.respond_to?(:price)

json.product_images @product.product_images do |product_image|
  json.id product_image.id
  json.image_url rails_blob_url(product_image.image)
  json.gallery_url user_product_path(@product.user.username, @product, image: product_image.id)
end

json.product_shippings @product.product_shippings do |product_shipping|
  json.id product_shipping.id
  json.country product_shipping.country
  json.base_cost product_shipping.base_cost
  json.additional_cost product_shipping.additional_cost

  json.base_cost_formatted number_to_currency(product_shipping.base_cost)
  json.additional_cost_formatted number_to_currency(product_shipping.additional_cost)
end
