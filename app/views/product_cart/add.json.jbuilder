json.array! @cart.product_cart_items do |item|
  json.id item.id
  json.quantity item.quantity
  json.price item.price
  json.total_price item.total_price
  
  json.product do
    json.id item.product.id
    json.title item.product.title
    json.description item.product.description
    json.price item.product.price
    json.slug item.product.slug
    
    json.user do
      json.username item.product.user.username
      json.avatar_url do
        json.small item.product.user.avatar_url(:small) if item.product.user.avatar_url(:small)
        json.medium item.product.user.avatar_url(:medium) if item.product.user.avatar_url(:medium)
      end
    end
    
    json.cover_url do
      json.small item.product.cover_url(:small) if item.product.cover_url(:small)
      json.medium item.product.cover_url(:medium) if item.product.cover_url(:medium)
      json.large item.product.cover_url(:large) if item.product.cover_url(:large)
    end

    if item.product.gallery.attached?
      json.gallery item.product.gallery.map { |img| 
        {
          small: rails_blob_path(img.variant(:small), only_path: true),
          medium: rails_blob_path(img.variant(:medium), only_path: true),
          large: rails_blob_path(img.variant(:large), only_path: true)
        }
      }
    end
    
    json.created_at item.product.created_at
    json.updated_at item.product.updated_at
  end
end
