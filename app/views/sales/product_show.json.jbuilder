json.product do
  json.extract! @product, :id, :title, :description, :price, :stock_quantity, :sku, :category, :status

  json.user do
    json.id @product.user.id
    json.username @product.user.username
    json.avatar_url @product.user.avatar_url
  end

  if @product.album
    json.album do
      json.id @product.album.id
      json.title @product.album.title
    end
  end

  json.product_images @product.product_images do |img|
    json.id img.id
    json.image_url img.image.url
  end

  json.current_user_is_owner current_user.id == @product.user_id
  json.current_user_is_admin current_user.is_admin? if current_user.respond_to?(:is_admin?)
end

json.product_item do
  json.id @product_item.id
  json.total_quantity @product_item.total_quantity
  json.total_amount @product_item.total_amount
  json.status @product_item.status
  json.refunded @product_item.refunded?
  json.created_at @product_item.created_at

  json.type @product_item.class
  json.tracking_code @product_item.tracking_code
  json.shipping_status @product_item.shipping_status

  json.shipping_name @product_item.shipping_name
  json.shipping_address @product_item.shipping_address
  json.user do
    json.partial! "users/user", user: @product_item.user
  end

  json.can_refund @product_item.can_refund? if @product_item.respond_to?(:can_refund?)
end
