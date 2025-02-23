json.product do
  json.id @product.id
  json.type @product.type
  json.title @product.title
  json.slug @product.slug
  json.description @product.description
  json.category @product.category
  json.delivery_method @product.delivery_method
  json.duration_minutes @product.duration_minutes
  json.max_participants @product.max_participants
  json.prerequisites @product.prerequisites
  json.what_to_expect @product.what_to_expect
  json.cancellation_policy @product.cancellation_policy
  json.price @product.price
  json.stock_quantity @product.stock_quantity
  json.status @product.status
  json.created_at @product.created_at
  json.updated_at @product.updated_at

  json.photos @product.product_images do |photo|
    json.id photo.id
    json.url url_for(photo.image)
    json.name photo.title
  end

  json.user do
    json.id @product.user.id
    json.username @product.user.username
    json.name @product.user.full_name
    json.avatar_url url_for(@product.user.avatar) if @product.user.avatar.attached?
  end
end
