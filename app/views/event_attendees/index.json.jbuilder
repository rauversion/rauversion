json.collection @purchased_items do |item|
  purchased_item = item.purchased_item
  purchase = item.purchase
  json.id item.id
  json.created_at item.created_at
  json.checked_in_at item.checked_in_at
  json.state item.state

  json.event_ticket do
    json.id purchased_item.id
    json.title purchased_item.title
    json.price purchased_item.price
    # json.currency purchase.event_ticket.currency
  end

  json.user do
    json.partial! 'users/user', user: purchase.user, show_full_name: true
  end
end

json.metadata do
  json.partial! 'shared/pagination_metadata', collection: @purchased_items
end
