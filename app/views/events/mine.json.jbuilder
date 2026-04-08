json.collection @events do |event|
  json.extract! event, :id, :title, :state, :slug, :timezone
  json.created_at event.created_at
  json.updated_at event.updated_at
  json.event_start event.event_start
  json.event_ends event.event_ends
  json.location event.location
  json.venue event.venue
  json.online event.online
  json.cover_url do
    json.medium event.cover_url(:medium)
    json.small event.cover_url(:small)
    json.large event.cover_url(:large)
  end
  
  json.user do
    json.partial! 'users/user', user: event.user, show_full_name: true
  end
end

json.metadata do
  json.partial! 'shared/pagination_metadata', collection: @events
end
