json.track_playlist do
  json.partial! 'track_playlists/track_playlist', track_playlist: @track_playlist
end

json.status "ok"
json.message "Track added to playlist successfully"
json.added true
