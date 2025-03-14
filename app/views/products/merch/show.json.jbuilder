json.product do
  json.id @product.id
  json.title @product.title
  json.type @product.type
  json.slug @product.slug
  json.sku @product.sku
  json.description @product.description
  json.category @product.category
  json.price @product.price
  json.stock_quantity @product.stock_quantity
  json.status @product.status
  json.shipping_days @product.shipping_days
  json.created_at @product.created_at
  json.updated_at @product.updated_at

  # Product photos
  json.photos @product.product_images do |photo|
    json.id photo.id
    json.url url_for(photo.image)
    json.title photo.title
  end

  # Shipping options
  json.shipping_options @product.product_shippings do |shipping|
    json.id shipping.id
    json.country shipping.country
    json.base_cost shipping.base_cost
    json.additional_cost shipping.additional_cost
    # json.estimated_days shipping.estimated_days
  end

  # Seller information
  json.user do
    json.partial! 'users/user', user: @product.user, show_full_name: true
  end
end
