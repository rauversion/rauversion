json.id @purchase.id
json.payment_url @payment_url if @payment_url.present?
json.checkout_type @purchase.checkout_type
json.checkout_id @purchase.checkout_id

json.errors @purchase.errors.full_messages

json.purchased_items @purchase.purchased_items do |item|
  json.id item.id
  json.price item.price # The actual price paid (including custom_price for PWYW)
  json.currency item.currency
  # json.quantity item.quantity
  json.purchased_item do
    json.id item.purchased_item.id
    json.title item.purchased_item.title
    json.price item.purchased_item.price # The base price of the ticket
  end
end
