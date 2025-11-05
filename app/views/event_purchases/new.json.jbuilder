json.tickets @tickets do |ticket|
  json.id ticket.id
  json.title ticket.title
  json.price ticket.price
  json.short_description ticket.short_description
  json.quantity ticket.qty.to_i
  json.min_tickets_per_order ticket.min_tickets_per_order
  json.max_tickets_per_order ticket.max_tickets_per_order
end

json.event do
  json.id @event.id
  json.title @event.title
  json.ticket_currency @event.ticket_currency
end
