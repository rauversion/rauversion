json.event_ticket do
  json.is_manager @is_manager
  json.extract! @ticket, :id, :title, :price, :qty, :short_description, :selling_start, :selling_end
  json.settings do
    json.show_sell_until @ticket.show_sell_until
    json.show_after_sold_out @ticket.show_after_sold_out
    json.fee_type @ticket.fee_type
    json.hidden @ticket.hidden
    json.max_tickets_per_order @ticket.max_tickets_per_order
    json.min_tickets_per_order @ticket.min_tickets_per_order
    json.sales_channel @ticket.sales_channel
    json.after_purchase_message @ticket.after_purchase_message
  end
  
  json.purchased_item do
    if @purchased_item.present?
      json.id @purchased_item.id
      json.state @purchased_item.state
      json.price @purchased_item.price
      json.currency @purchased_item.currency
      json.paid @purchased_item.paid?
      json.qr @purchased_item.qr
      json.checked_in_at @purchased_item.checked_in_at
      json.checked_in @purchased_item.checked_in?
      json.purchase do
        json.user do
          json.email @purchased_item.purchase.user.email
        end
      end
    end
  end

  json.event do
    json.id @event.id
    json.slug @event.slug
    json.title @event.title
    json.event_dates @event.event_dates
    json.location @event.location
    json.ticket_currency @event.ticket_currency
    json.presicion_for_currency @event.presicion_for_currency
  end
end
