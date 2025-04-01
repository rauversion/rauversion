if @track_form.errors.any?
  json.success false
  json.errors @track_form.errors.full_messages
else
  json.success true
  json.tracks @track_form.tracks do |track|
    json.partial! 'tracks/track', track: track
  end
end
