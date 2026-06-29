json.service_booking do
  json.id @service_booking.id
  json.status @service_booking.status
  json.created_at @service_booking.created_at
  
  json.service_product do
    json.id @service_booking.service_product.id
    json.title @service_booking.service_product.title
    json.service_kind @service_booking.service_product.service_kind
    json.category @service_booking.service_product.category
    json.booking_mode @service_booking.service_product.booking_mode
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
  json.payment do
    json.status @service_booking.payment_status
    json.refund_status @service_booking.refund_status
    json.currency @service_booking.currency
    json.subtotal_amount @service_booking.subtotal_amount
    json.total_amount @service_booking.total_amount
    json.deposit_amount @service_booking.deposit_amount
    json.balance_due_amount @service_booking.balance_due_amount
    json.checkout_provider @service_booking.checkout_provider
    json.payment_intent_id @service_booking.payment_intent_id if @service_booking.provider == current_user
    json.payment_session_id @service_booking.payment_session_id if @service_booking.provider == current_user
    json.refund_id @service_booking.refund_id if @service_booking.refund_id.present?
    json.refunded_at @service_booking.refunded_at
    json.deposit_status @service_booking.deposit_status
    json.balance_status @service_booking.balance_status
    json.deposit_paid_at @service_booking.deposit_paid_at
    json.deposit_confirmed_at @service_booking.deposit_confirmed_at
    json.balance_paid_at @service_booking.balance_paid_at
    json.balance_confirmed_at @service_booking.balance_confirmed_at
    json.deposit_checkout_session_id @service_booking.deposit_checkout_session_id
    json.deposit_payment_intent_id @service_booking.deposit_payment_intent_id if @service_booking.provider == current_user
    json.balance_checkout_session_id @service_booking.balance_checkout_session_id
    json.balance_payment_intent_id @service_booking.balance_payment_intent_id if @service_booking.provider == current_user
    json.platform_fee_rate @service_booking.platform_fee_rate
    json.platform_fee_amount @service_booking.platform_fee_amount
    json.artist_payout_amount @service_booking.artist_payout_amount
    json.tracking_notes @service_booking.payment_tracking_notes
  end
  json.contract do
    json.status @service_booking.contract_status
    json.signed_at @service_booking.contract_signed_at
    json.agreement_snapshot @service_booking.agreement_snapshot
    json.proposal_id @service_booking.service_booking_proposal&.id
  end
  json.venue do
    json.starts_at @service_booking.starts_at
    json.ends_at @service_booking.ends_at
    json.name @service_booking.venue_name
    json.address @service_booking.venue_address
    json.city @service_booking.city
    json.country @service_booking.country
  end
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

  json.ledger_entries @service_booking.ledger_entries do |entry|
    json.id entry.id
    json.entry_type entry.entry_type
    json.milestone entry.milestone
    json.direction entry.direction
    json.amount entry.amount
    json.currency entry.currency
    json.status entry.status
    json.gateway entry.gateway
    if @service_booking.provider == current_user
      json.gateway_reference entry.gateway_reference
      json.metadata entry.metadata
    end
    json.occurred_at entry.occurred_at
    json.created_at entry.created_at
    json.actor do
      if entry.actor
        json.id entry.actor.id
        json.name entry.actor.full_name
      end
    end
  end

  json.actions do
    json.can_confirm @service_booking.pending_confirmation? && current_user == @service_booking.provider
    json.can_schedule @service_booking.confirmed? && current_user == @service_booking.provider
    json.can_complete @service_booking.scheduled? && current_user == @service_booking.provider
    json.can_cancel @service_booking.may_cancel? && [@service_booking.customer, @service_booking.provider].include?(current_user)
    json.can_refund @service_booking.may_refund? && current_user == @service_booking.provider
    json.can_pay_deposit_with_stripe @service_booking.may_pay_deposit_with_stripe?(current_user)
    json.can_mark_deposit_paid @service_booking.may_mark_deposit_paid?(current_user)
    json.can_confirm_deposit @service_booking.may_confirm_deposit?(current_user)
    json.can_pay_balance_with_stripe @service_booking.may_pay_balance_with_stripe?(current_user)
    json.can_mark_balance_paid @service_booking.may_mark_balance_paid?(current_user)
    json.can_confirm_balance @service_booking.may_confirm_balance?(current_user)
    json.can_give_feedback @service_booking.completed? && current_user == @service_booking.customer && !@service_booking.rating
  end
end
