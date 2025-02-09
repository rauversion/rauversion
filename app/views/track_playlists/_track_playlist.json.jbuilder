json.extract! track_playlist,
  :id,
  :track_id,
  :playlist_id,
  :position,
  :created_at,
  :updated_at

json.track do
  json.extract! track_playlist.track,
    :id,
    :title,
    :description,
    :private
  json.cover track_playlist.track.cover.url if track_playlist.track.cover.present?
end

json.playlist do
  json.extract! track_playlist.playlist,
    :id,
    :title,
    :private
end
