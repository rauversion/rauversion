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
  json.id host.id
  json.name host.name
  json.description host.description
  json.listed_on_page host.listed_on_page
  json.event_manager host.event_manager
  json.user do
    json.partial! 'users/user', user: host.user, show_full_name: true if host.user.present?
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

if @event.streaming_service.present?
  json.streaming_service do
    json.name @event.streaming_service["name"]
    
    # Get the service class for the current provider
    # service_klass = StreamingProviders::Service.find_module_by_type(@event.streaming_service["name"])
    # if service_klass
    #   # Get the field definitions for this service
    #   fields = service_klass.definitions.map { |f| f[:name].to_s }
    #   # Only include the fields that are valid for this service
    #   fields.each do |field|
    #     json.set! field, @event.streaming_service[field]
    #   end
    # end
  end
end

json.scheduling_settings @event.scheduling_settings if @event.scheduling_settings.present?
json.event_settings @event.event_settings if @event.event_settings.present?
json.tickets @event.event_tickets if @event.event_tickets.present?

json.author do
  json.partial! 'users/user', user: @event.user, show_full_name: true
end
