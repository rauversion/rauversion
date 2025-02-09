json.track_playlist do
  json.extract! @track_playlist,
    :id,
    :track_id,
    :playlist_id
end

json.status "ok"
json.message "Track removed from playlist successfully"
json.added false
