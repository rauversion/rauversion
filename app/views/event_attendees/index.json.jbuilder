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
    json.id purchase.user.id
    json.email purchase.user.email
    json.name purchase.user.username
    json.initials purchase.user.username.split(' ').map(&:first).join('')
    json.avatar_url purchase.user.avatar_url
  end
end

json.metadata do
  json.current_page @purchased_items.current_page
  json.total_pages @purchased_items.total_pages
  json.next_page @purchased_items.next_page
  json.prev_page @purchased_items.prev_page
  json.is_first_page @purchased_items.first_page?
  json.is_last_page @purchased_items.last_page?
  json.total_count @purchased_items.total_count
end
