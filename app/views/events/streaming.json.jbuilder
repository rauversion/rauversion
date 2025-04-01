json.event do
  json.id @event.id
  json.slug @event.slug
  json.streaming_service @event.streaming_service
  json.online @event.online
  
  # Extract streaming settings from streaming_service hash
  if @event.streaming_service.present?
    json.stream_type @event.streaming_service["stream_type"]
    json.stream_url @event.streaming_service["stream_url"]
    json.stream_key @event.streaming_service["stream_key"]
    json.custom_embed_code @event.streaming_service["custom_embed_code"]
    json.is_streaming @event.streaming_service["is_streaming"]
    json.chat_enabled @event.streaming_service["chat_enabled"]
    json.chat_only_members @event.streaming_service["chat_only_members"]
    json.recording_enabled @event.streaming_service["recording_enabled"]
  end
end
