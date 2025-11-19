json.tickets @tickets do |ticket|
  json.id ticket.id
  json.title ticket.title
  json.price ticket.price
  json.short_description ticket.short_description
  json.quantity ticket.qty.to_i
  json.pay_what_you_want ticket.pay_what_you_want?
  json.sold_out? ticket.qty.to_i <= 0
  json.minimum_price ticket.minimum_price
  json.min_tickets_per_order ticket.min_tickets_per_order
  json.max_tickets_per_order ticket.max_tickets_per_order
end

json.event do
  json.id @event.id
  json.title @event.title
  json.ticket_currency @event.ticket_currency
  json.show_remaining_tickets @event.show_remaining_tickets
end

json.current_user do
  if current_user
    json.id current_user.id
    json.email current_user.email
    json.authenticated true
  else
    json.authenticated false
  end
end
