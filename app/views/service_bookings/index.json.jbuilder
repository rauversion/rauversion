json.service_bookings @service_bookings do |booking|
  json.id booking.id
  json.status booking.status
  json.created_at booking.created_at
  
  json.service_product do
    json.id booking.service_product.id
    json.title booking.service_product.title
    json.service_kind booking.service_product.service_kind
    json.category booking.service_product.category
    json.booking_mode booking.service_product.booking_mode
    json.delivery_method booking.service_product.delivery_method
  end

  json.customer do
    json.id booking.customer.id
    json.name booking.customer.full_name
    json.avatar_url booking.customer.avatar_url
  end

  json.conversations booking.conversations do |conversation|
    json.id conversation.id
    json.subject conversation.subject
    json.status conversation.status 
    json.created_at conversation.created_at
  end

  json.provider do
    json.id booking.provider.id
    json.name booking.provider.full_name
    json.avatar_url booking.provider.avatar_url
  end

  json.metadata do
    json.scheduled_date booking.scheduled_date
    json.scheduled_time booking.scheduled_time
    json.timezone booking.timezone
    json.meeting_link booking.meeting_link
    json.meeting_location booking.meeting_location
    json.special_requirements booking.special_requirements
    json.provider_notes booking.provider_notes if booking.provider == current_user
    json.cancellation_reason booking.cancellation_reason if booking.cancelled?
  end

  json.rating booking.rating
  json.feedback booking.feedback
  json.payment do
    json.status booking.payment_status
    json.refund_status booking.refund_status
    json.currency booking.currency
    json.total_amount booking.total_amount
    json.checkout_provider booking.checkout_provider
    json.refunded_at booking.refunded_at
    json.deposit_status booking.deposit_status
    json.balance_status booking.balance_status
  end
  json.cancelled_by do
    if booking.cancelled_by
      json.id booking.cancelled_by.id
      json.name booking.cancelled_by.name
    end
  end
end
