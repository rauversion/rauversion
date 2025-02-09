json.event do
  json.id @event.id
  json.slug @event.slug
  json.state @event.state
  json.private @event.private
  json.online @event.online
  
  # Event settings
  json.event_settings @event.event_settings
  json.participant_label @event.participant_label
  json.participant_description @event.participant_description
  json.accept_sponsors @event.accept_sponsors
  json.sponsors_label @event.sponsors_label
  json.sponsors_description @event.sponsors_description
  
  # Attendee settings
  json.attendee_list_settings @event.attendee_list_settings
  json.event_capacity @event.event_capacity
  json.event_capacity_limit @event.event_capacity_limit
  
  # Ticket settings
  json.eticket @event.eticket
  json.will_call @event.will_call
  json.order_form @event.order_form
  json.widget_button @event.widget_button
  json.tax_rates_settings @event.tax_rates_settings
  
  # Location settings
  json.location @event.location
  json.venue @event.venue
  json.street @event.street
  json.street_number @event.street_number
  json.country @event.country
  json.city @event.city
  json.province @event.province
  json.postal @event.postal
  json.lat @event.lat
  json.lng @event.lng
end
