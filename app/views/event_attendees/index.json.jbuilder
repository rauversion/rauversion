json.collection @purchased_items do |item|
  purchased_item = item.purchased_item
  purchase = item.purchase
  json.id item.id
  json.created_at item.created_at
  json.checked_in_at item.checked_in_at
  json.state item.state
  json.currency item.currency
  json.price item.price
  json.guest_email purchase.guest_email if purchase.guest_email.present?

  json.event_ticket do
    json.id purchased_item.id
    json.title purchased_item.title
    json.price item.price || purchased_item.price
    json.currency item.currency
  end

  json.user do
    json.email purchase.user.email
    json.partial! 'users/user', user: purchase.user, show_full_name: true
  end
end

json.permissions do
  json.can_access_admission @event.can_access_admission?(current_user)
  json.can_create_invitations @event.can_manage_attendee_invitations?(current_user)
  json.can_export_attendees @event.can_export_attendees?(current_user)
  json.can_refund_attendees @event.can_refund_attendees?(current_user)
end

json.metadata do
  json.partial! 'shared/pagination_metadata', collection: @purchased_items
end
