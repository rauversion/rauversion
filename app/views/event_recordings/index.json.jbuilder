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
  json.partial! 'shared/pagination_metadata', collection: @event_recordings
end
