if @track_form.errors.any?
  json.success false
  json.errors @track_form.errors.full_messages
else
  json.success true
  json.tracks @track_form.tracks do |track|
    json.partial! 'tracks/track', track: track
  end

  if @track_form.playlist.present?
    json.playlist do
      json.partial! 'playlists/playlist',
        playlist: @track_form.playlist,
        show_details: true,
        show_tracks_count: true
    end
  end
end
