json.collection @event_recordings do |recording|
  json.id recording.id
  json.type recording.type
  json.title recording.title
  json.description recording.description
  json.iframe recording.iframe
  json.properties recording.properties
  json.position recording.position
  json.created_at recording.created_at
  json.updated_at recording.updated_at
end

json.metadata do
  json.current_page @event_recordings.current_page
  json.total_pages @event_recordings.total_pages
  json.next_page @event_recordings.next_page
  json.prev_page @event_recordings.prev_page
  json.is_first_page @event_recordings.first_page?
  json.is_last_page @event_recordings.last_page?
  json.total_count @event_recordings.total_count
end
