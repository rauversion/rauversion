json.service_booking do
  json.id @service_booking.id
  json.status @service_booking.status
  json.created_at @service_booking.created_at
  
  json.service_product do
    json.id @service_booking.service_product.id
    json.title @service_booking.service_product.title
    json.delivery_method @service_booking.service_product.delivery_method
    json.description @service_booking.service_product.description
    json.price @service_booking.service_product.price
  end

  json.customer do
    json.id @service_booking.customer.id
    json.name @service_booking.customer.full_name
    json.avatar_url @service_booking.customer.avatar_url
  end

  json.provider do
    json.id @service_booking.provider.id
    json.name @service_booking.provider.full_name
    json.avatar_url @service_booking.provider.avatar_url
  end

  json.metadata do
    json.scheduled_date @service_booking.scheduled_date
    json.scheduled_time @service_booking.scheduled_time
    json.timezone @service_booking.timezone
    json.meeting_link @service_booking.meeting_link
    json.meeting_location @service_booking.meeting_location
    json.special_requirements @service_booking.special_requirements
    json.provider_notes @service_booking.provider_notes if @service_booking.provider == current_user
    json.cancellation_reason @service_booking.cancellation_reason if @service_booking.cancelled?
  end

  json.rating @service_booking.rating
  json.feedback @service_booking.feedback
  json.cancelled_by do
    if @service_booking.cancelled_by
      json.id @service_booking.cancelled_by.id
      json.name @service_booking.cancelled_by.name
    end
  end

  json.conversations @service_booking.conversations do |conversation|
    json.id conversation.id
    json.subject conversation.subject
    json.status conversation.status 
    json.created_at conversation.created_at
  end

  json.actions do
    json.can_confirm @service_booking.pending_confirmation? && current_user == @service_booking.provider
    json.can_schedule @service_booking.confirmed? && current_user == @service_booking.provider
    json.can_complete @service_booking.scheduled? && current_user == @service_booking.provider
    json.can_cancel @service_booking.may_cancel?
    json.can_give_feedback @service_booking.completed? && current_user == @service_booking.customer && !@service_booking.rating
  end
end
