json.cart do
  json.id @cart.id
  json.total_items @cart.product_items.sum(:quantity)
  json.total_price @cart.total_price
  json.items @cart.product_items do |item|
    json.id item.id
    json.quantity item.quantity
    json.price item.price
    json.product do
      json.id item.product.id
      json.title item.product.title
      json.description item.product.description
      json.price item.product.price
      json.cover_url do
        json.small item.product.cover_url(:small) if item.product.cover_url(:small)
        json.medium item.product.cover_url(:medium) if item.product.cover_url(:medium)
        json.large item.product.cover_url(:large) if item.product.cover_url(:large)
      end
    end
  end
end
