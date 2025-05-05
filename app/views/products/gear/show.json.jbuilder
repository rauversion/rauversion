json.product do
  json.id @product.id
  json.title @product.title
  json.slug @product.slug
  json.type @product.type
  json.description @product.description
  json.category @product.category
  json.brand @product.brand
  json.model @product.model
  json.year @product.year
  json.condition @product.condition
  json.price @product.price
  json.formatted_price number_to_currency(@product.price)

  json.stock_quantity @product.stock_quantity
  json.status @product.status
  json.accept_barter @product.accept_barter
  json.barter_description @product.barter_description if @product.accept_barter
  json.shipping_days @product.shipping_days
  json.created_at @product.created_at
  json.updated_at @product.updated_at
  json.sku @product.sku

  # Product photos
  json.photos @product.product_images do |photo|
    json.id photo.id
    json.url url_for(photo.image)
    json.filename photo.image.filename
  end

  # Shipping options
  json.shipping_options @product.product_shippings do |shipping|
    json.id shipping.id
    json.country shipping.country
    # json.estimated_days shipping.estimated_days
    # 
    json.base_cost shipping.base_cost
    json.additional_cost shipping.additional_cost
  
    json.base_cost_formatted number_to_currency(shipping.base_cost)
    json.additional_cost_formatted number_to_currency(shipping.additional_cost)
   
  end

  # Seller information
  json.user do
    json.partial! 'users/user', user: @product.user, show_full_name: true
  end
end
