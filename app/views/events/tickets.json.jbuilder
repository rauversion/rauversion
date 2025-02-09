json.event do
  json.id @event.id
  json.slug @event.slug
  json.ticket_currency @event.ticket_currency
  json.tickets @event.tickets
  json.tax_rates_settings @event.tax_rates_settings
  json.event_capacity @event.event_capacity
  json.event_capacity_limit @event.event_capacity_limit
  
  json.event_tickets @event.event_tickets do |ticket|
    json.id ticket.id
    json.title ticket.title
    json.short_description ticket.short_description
    json.price ticket.price
    json.qty ticket.qty
    json.selling_start ticket.selling_start
    json.selling_end ticket.selling_end
    json.show_sell_until ticket.show_sell_until
    json.show_after_sold_out ticket.show_after_sold_out
    json.hidden ticket.hidden
    json.min_tickets_per_order ticket.min_tickets_per_order
    json.max_tickets_per_order ticket.max_tickets_per_order
    json.after_purchase_message ticket.after_purchase_message
    json.sales_channel ticket.sales_channel
    json.created_at ticket.created_at
    json.updated_at ticket.updated_at
    
    json.sales_count ticket.sales_count if ticket.respond_to?(:sales_count)
    json.available_quantity ticket.available_quantity if ticket.respond_to?(:available_quantity)
  end
end
