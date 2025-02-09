if @event_recording.errors.any?
  json.errors @event_recording.errors.messages
else
  json.partial! 'event_recordings/show', event_recording: @event_recording
end
