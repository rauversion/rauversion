json.id proposal.id
json.status proposal.status
json.created_at proposal.created_at
json.updated_at proposal.updated_at
json.event_name proposal.event_name
json.event_date proposal.event_date
json.starts_at proposal.starts_at
json.ends_at proposal.ends_at
json.venue_name proposal.venue_name
json.venue_address proposal.venue_address
json.city proposal.city
json.country proposal.country
json.proposed_amount proposal.proposed_amount
json.currency proposal.currency
json.formatted_proposed_amount formatted_product_price(proposal.proposed_amount, proposal.currency)
json.deposit_percentage proposal.deposit_percentage
json.deposit_amount proposal.deposit_amount
json.formatted_deposit_amount formatted_product_price(proposal.deposit_amount, proposal.currency)
json.balance_amount proposal.balance_amount
json.formatted_balance_amount formatted_product_price(proposal.balance_amount, proposal.currency)
json.fee_type proposal.fee_type
json.transport_included proposal.transport_included
json.accommodation_included proposal.accommodation_included
json.hospitality_included proposal.hospitality_included
json.catering_included proposal.catering_included
json.guest_list_count proposal.guest_list_count
json.benefits proposal.benefits
json.technical_notes proposal.technical_notes
json.message proposal.message
json.booker_counter_count proposal.booker_counter_count
json.artist_counter_count proposal.artist_counter_count
json.negotiation_history proposal.negotiation_history
json.platform_fee_rate proposal.platform_fee_rate
json.platform_fee_min_amount proposal.platform_fee_min_amount
json.formatted_platform_fee_min_amount formatted_product_price(proposal.platform_fee_min_amount, proposal.currency)
json.platform_fee_amount proposal.platform_fee_amount
json.formatted_platform_fee_amount formatted_product_price(proposal.platform_fee_amount, proposal.currency)
json.artist_payout_amount proposal.artist_payout_amount
json.formatted_artist_payout_amount formatted_product_price(proposal.artist_payout_amount, proposal.currency)
json.accepted_at proposal.accepted_at
json.expires_at proposal.expires_at
json.contract_snapshot proposal.contract_snapshot
json.service_booking_id proposal.service_booking_id

json.service_product do
  json.id proposal.service_product.id
  json.title proposal.service_product.title
  json.slug proposal.service_product.slug
  json.service_kind proposal.service_product.service_kind
  json.category proposal.service_product.category
  json.booking_mode proposal.service_product.booking_mode
end

json.booker do
  json.id proposal.booker.id
  json.name proposal.booker.full_name
  json.username proposal.booker.username
  json.avatar_url proposal.booker.avatar_url
end

json.artist do
  json.id proposal.artist.id
  json.name proposal.artist.full_name
  json.username proposal.artist.username
  json.avatar_url proposal.artist.avatar_url
end

json.current_offer_by do
  if proposal.current_offer_by
    json.id proposal.current_offer_by.id
    json.name proposal.current_offer_by.full_name
  end
end

json.conversations proposal.conversations do |conversation|
  json.id conversation.id
  json.subject conversation.subject
  json.status conversation.status
  json.created_at conversation.created_at
end

json.viewer do
  json.role current_user == proposal.artist ? "artist" : "booker"
end

json.actions do
  json.can_counter proposal.can_counter?(current_user)
  json.can_accept proposal.can_accept?(current_user)
  json.can_reject proposal.can_reject?(current_user)
  json.can_cancel proposal.can_cancel?(current_user)
end
