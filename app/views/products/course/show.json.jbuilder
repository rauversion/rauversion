json.product do
  json.id @product.id
  json.title @product.title
  json.slug @product.slug
  json.type @product.type
  json.description @product.description
  json.price @product.price
  json.formatted_price number_to_currency(@product.price)

  # Product photos
  json.photos @product.product_images do |photo|
    json.id photo.id
    json.url url_for(photo.image)
    json.filename photo.image.filename
  end

  # Seller information
  json.user do
    json.partial! 'users/user', user: @product.user, show_full_name: true
  end
end
