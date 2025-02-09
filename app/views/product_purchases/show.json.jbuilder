json.purchase do
  json.id @purchase.id
  json.status @purchase.status
  json.shipping_status @purchase.shipping_status
  json.total_amount @purchase.total_amount
  json.shipping_cost @purchase.shipping_cost
  json.total_with_shipping @purchase.total_with_shipping
  json.total_quantity @purchase.total_quantity
  json.created_at @purchase.created_at
  json.updated_at @purchase.updated_at

  if @purchase.shipping_address.present?
    json.shipping_address do
      json.name @purchase.shipping_name
      json.phone @purchase.phone
      json.line1 @purchase.line1
      json.line2 @purchase.line2
      json.city @purchase.city
      json.state @purchase.state
      json.postal_code @purchase.postal_code
      json.country @purchase.country
    end
  end

  json.tracking_code @purchase.tracking_code if @purchase.tracking_code.present?
  
  json.items @purchase.product_purchase_items do |item|
    json.id item.id
    json.quantity item.quantity
    json.price item.price
    json.shipping_cost item.shipping_cost
    json.total_price_with_shipping item.total_price_with_shipping
    
    json.product do
      json.id item.product.id
      json.title item.product.title
      json.description item.product.description
      json.price item.product.price
      json.slug item.product.slug
      
      json.images item.product.product_images do |image|
        json.small image.image_url(:small) if image.image_url(:small)
        json.medium image.image_url(:medium) if image.image_url(:medium)
        json.large image.image_url(:large) if image.image_url(:large)
      end

      json.user do
        json.username item.product.user.username
        json.avatar_url do
          json.small item.product.user.avatar_url(:small) if item.product.user.avatar_url(:small)
          json.medium item.product.user.avatar_url(:medium) if item.product.user.avatar_url(:medium)
        end
      end
    end
  end
end
