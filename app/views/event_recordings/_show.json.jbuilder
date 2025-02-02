json.recording do
  json.id event_recording.id
  json.type event_recording.type
  json.title event_recording.title
  json.description event_recording.description
  json.iframe event_recording.iframe
  json.properties event_recording.properties
  json.position event_recording.position
  json.created_at event_recording.created_at
  json.updated_at event_recording.updated_at
end
