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
json.age_requirement @event.age_requirement
json.event_capacity @event.event_capacity
json.event_capacity_limit @event.event_capacity_limit
json.eticket @event.eticket
json.will_call @event.will_call
json.cover_url do
  json.medium @event.cover_url(:medium)
  json.small @event.cover_url(:small)
  json.large @event.cover_url(:large)
end

# Event specific labels
json.participant_label @event.participant_label
json.participant_description @event.participant_description
json.scheduling_label @event.scheduling_label

# Stats
json.event_hosts_count @event.event_hosts.size
json.attendees_count @event.purchased_items.where(state: "paid").size

# Event hosts/speakers
json.event_hosts @event.event_hosts do |host|
  json.name host.name
  json.description host.description
  json.listed_on_page host.listed_on_page
  json.event_manager host.event_manager
  json.user do
    json.avatar_url do
      json.medium host.user.avatar_url(:medium)
      json.small host.user.avatar_url(:small)
    end
  end
end

# Event schedules
json.event_schedules @event.event_schedules do |schedule|
  json.name schedule.name
  json.description schedule.description
  json.start_date schedule.start_date
  json.end_date schedule.end_date
  json.schedule_type schedule.schedule_type
  json.id schedule.id
  json.schedulings schedule.schedule_schedulings do |scheduling|
    json.id scheduling.id
    json.name scheduling.name
    json.start_date scheduling.start_date
    json.end_date scheduling.end_date
    json.short_description scheduling.short_description
  end
end

json.order_form @event.order_form if @event.order_form.present?
json.widget_button @event.widget_button if @event.widget_button.present?
json.tax_rates_settings @event.tax_rates_settings if @event.tax_rates_settings.present?
json.attendee_list_settings @event.attendee_list_settings if @event.attendee_list_settings.present?
json.scheduling_settings @event.scheduling_settings if @event.scheduling_settings.present?
json.event_settings @event.event_settings if @event.event_settings.present?
json.tickets @event.tickets if @event.tickets.present?
json.streaming_service @event.streaming_service if @event.streaming_service.present?

json.author do 
  json.id @event.user.id
  json.username @event.user.username
  json.full_name @event.user.full_name
  json.avatar @event.user.avatar_url(:small)
end
