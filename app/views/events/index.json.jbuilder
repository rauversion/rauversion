json.events @events do |event|
  json.id event.id
  json.slug event.slug
  json.title event.title
  json.description event.description
  json.state event.state
  json.timezone event.timezone
  json.event_start event.event_start
  json.event_ends event.event_ends
  json.private event.private
  json.online event.online
  json.location event.location
  json.street event.street
  json.street_number event.street_number
  json.lat event.lat
  json.lng event.lng
  json.venue event.venue
  json.country event.country
  json.city event.city
  json.province event.province
  json.postal event.postal
  json.age_requirement event.age_requirement
  json.event_capacity event.event_capacity
  json.event_capacity_limit event.event_capacity_limit
  json.eticket event.eticket
  json.will_call event.will_call
  json.cover_url do
    json.medium event.cover_url(:medium)
    json.small event.cover_url(:small)
    json.large event.cover_url(:large)
  end
  
  json.author event.user do
    json.partial! 'users/user', user: event.user, show_full_name: true
  end
end

json.past_events @past_events do |event|
  json.id event.id
  json.slug event.slug
  json.title event.title
  json.description event.description
  json.state event.state
  json.timezone event.timezone
  json.event_start event.event_start
  json.event_ends event.event_ends
  json.private event.private
  json.online event.online
  json.location event.location
  json.venue event.venue
  json.cover_url do
    json.medium event.cover_url(:medium)
    json.small event.cover_url(:small)
    json.large event.cover_url(:large)
  end
  
  json.author do
    json.partial! 'users/user', user: event.user, show_full_name: true
  end
end

json.total_count @events.total_count
json.current_page @events.current_page
json.total_pages @events.total_pages
