json.product do
  json.id @product.id
  json.title @product.title
  json.slug @product.slug
  json.description @product.description
  json.category @product.category
  json.price @product.price
  json.formatted_price number_to_currency(@product.price)
  json.type @product.type
  json.stock_quantity @product.stock_quantity
  json.sku @product.sku
  json.status @product.status
  json.condition @product.condition
  json.include_digital_album @product.include_digital_album
  json.limited_edition @product.limited_edition
  json.limited_edition_count @product.limited_edition_count if @product.limited_edition
  json.shipping_days @product.shipping_days
  json.created_at @product.created_at
  json.updated_at @product.updated_at
  json.playlist_id @product.playlist_id
  json.accept_barter @product.accept_barter
  json.barter_description @product.barter_description

  # Associated album details
  if @product.album.present?
    json.album do
      json.partial! 'playlists/playlist', playlist: @product.album
    end
  end

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
  
    json.base_cost_formatted number_to_currency(shipping.base_cost)
    json.additional_cost_formatted number_to_currency(shipping.additional_cost)
    # json.estimated_days shipping.estimated_days
  end


  # Seller information
  json.user do
    json.partial! 'users/user', user: @product.user, show_full_name: true
  end
end
