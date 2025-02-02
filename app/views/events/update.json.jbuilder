json.event do
  json.id @event.id
  json.slug @event.slug
  json.title @event.title
  json.description @event.description
  json.state @event.state
  json.timezone @event.timezone
  json.event_start @event.event_start
  json.event_ends @event.event_ends
  json.private @event.private
  json.online @event.online
  
  # Location details
  json.location @event.location
  json.street @event.street
  json.street_number @event.street_number
  json.lat @event.lat
  json.lng @event.lng
  json.venue @event.venue
  json.country @event.country
  json.city @event.city
  json.province @event.province
  json.postal @event.postal
  
  # Event settings
  json.age_requirement @event.age_requirement
  json.event_capacity @event.event_capacity
  json.event_capacity_limit @event.event_capacity_limit
  json.eticket @event.eticket
  json.will_call @event.will_call
  
  # Cover image URLs
  json.cover_url do
    json.medium @event.cover_url(:medium)
    json.small @event.cover_url(:small)
    json.large @event.cover_url(:large)
  end if @event.cover.attached?
  
  # Event specific labels and settings
  json.participant_label @event.participant_label
  json.participant_description @event.participant_description
  json.scheduling_label @event.scheduling_label
  json.accept_sponsors @event.accept_sponsors
  json.sponsors_label @event.sponsors_label
  json.sponsors_description @event.sponsors_description
  
  # Event settings JSON
  json.event_settings @event.event_settings
  json.scheduling_settings @event.scheduling_settings
  json.attendee_list_settings @event.attendee_list_settings
  json.tax_rates_settings @event.tax_rates_settings
  
  # Stats
  json.event_hosts_count @event.event_hosts.size
  json.attendees_count @event.purchased_items.where(state: "paid").size
  
  # Streaming settings if online
  if @event.online?
    json.streaming_service @event.streaming_service
  end
end
