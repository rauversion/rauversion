json.collection @events do |event|
  json.extract! event, :id, :title, :state, :slug, :timezone
  json.created_at event.created_at
  json.updated_at event.updated_at
  json.event_start event.event_start
  json.event_ends event.event_ends
  json.location event.location
  json.venue event.venue
  json.online event.online
  
  json.user do
    json.extract! event.user, :id, :username
    json.avatar_url do
      json.small event.user.avatar_url(:small)
    end
  end
end

json.metadata do
  json.current_page @events.current_page
  json.total_pages @events.total_pages
  json.total_count @events.total_count
  json.next_page @events.next_page
  json.prev_page @events.prev_page
  json.is_first_page @events.first_page?
  json.is_last_page @events.last_page?
end
