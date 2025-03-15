json.id @purchase.id
json.payment_url @payment_url if @payment_url.present?
json.checkout_type @purchase.checkout_type
json.checkout_id @purchase.checkout_id

json.purchased_items @purchase.purchased_items do |item|
  json.id item.id
  json.quantity item.quantity
  json.purchased_item do
    json.id item.purchased_item.id
    json.title item.purchased_item.title
    json.price item.purchased_item.price
  end
end
