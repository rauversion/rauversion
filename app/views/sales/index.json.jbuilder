json.collection @collection do |sale|
  json.id sale.id
  json.created_at sale.created_at
  json.updated_at sale.updated_at
  
  if sale.is_a?(ProductPurchase)
    json.type 'Product'
    json.items sale.product_purchase_items do |item|
      json.id item.id
      json.quantity item.quantity
      json.price item.price
      json.product do
        json.id item.product.id
        json.title item.product.title
        json.description item.product.description
      end
    end
    json.total_quantity sale.total_quantity
    json.status sale.status
    json.shipping_status sale.shipping_status
    json.tracking_code sale.tracking_code

    json.buyer do
      json.id sale.user.id
      json.email sale.user.email
      json.name sale.user.full_name
    end
  else
    json.type @tab
    json.purchased_item do
      json.id sale.purchased_item.id
      json.title sale.purchased_item.title
      json.description sale.purchased_item.description
      json.cover_url sale.purchased_item.cover_url(:small)
    end
    json.purchase do
      json.id sale.purchase.id
      json.created_at sale.purchase.created_at
      json.state sale.purchase.state
      json.price sale.purchase.price
      json.user do
        json.id sale.purchase.user.id
        json.email sale.purchase.user.email
        json.name sale.purchase.user.full_name
      end
    end
  end
end

json.metadata do
  json.total_count @collection.total_count
  json.current_page @collection.current_page
  json.total_pages @collection.total_pages
  json.next_page @collection.next_page
  json.prev_page @collection.prev_page
  json.tab @tab
end
