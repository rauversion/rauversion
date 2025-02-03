if @track.errors.any?
  json.success false
  json.errors @track.errors.full_messages
else
  json.success true
  json.track do
    json.partial! 'tracks/track', track: @track
  end
end
