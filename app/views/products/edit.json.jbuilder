json.extract! @product, :id, :title, :description, :price, :category, :slug, :status, :stock_quantity, :sku, :type
json.playlist_id @product.playlist_id

# Include additional fields based on product type
case @product.type
when "Products::GearProduct"
  json.extract! @product, :condition, :brand, :model, :year, :accept_barter, :barter_description
when "Products::MusicProduct"
  json.extract! @product, :limited_edition, :limited_edition_count, :include_digital_album
end

# Include shipping information
json.extract! @product, :shipping_days, :shipping_begins_on, :shipping_within_country_price, :shipping_worldwide_price

# Include visibility and pricing options
json.extract! @product, :visibility, :name_your_price, :quantity

json.user do
  json.extract! @product.user, :id, :username
end if @product.user.present?

json.album do
  json.extract! @product.album, :id, :title, :slug
end if @product.album.present?

json.product_images @product.product_images do |product_image|
  json.id product_image.id
  json.image_url rails_blob_url(product_image.image)
end

json.product_variants @product.product_variants do |variant|
  json.extract! variant, :id, :name, :price, :stock_quantity
end

json.product_options @product.product_options do |option|
  json.extract! option, :id, :name, :quantity, :sku
end

json.product_shippings @product.product_shippings do |shipping|
  json.extract! shipping, :id, :country, :base_cost, :additional_cost
end
