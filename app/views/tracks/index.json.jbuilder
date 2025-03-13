json.tracks @tracks do |track|
  json.partial! 'tracks/track', track: track
end

json.popular_tags @popular_tags do |tag|
  json.tag tag.tag
  json.count tag.count
end

json.artists @artists do |user|
  json.partial! 'users/user', user: user, show_full_name: true
end

json.featured_albums Playlist.published.latests
  .includes(:releases, :user)
  .where(playlist_type: ["ep", "album"])
  .order("editor_choice_position asc, release_date desc, id desc")
  .limit(3) do |playlist|
    json.partial! 'playlists/playlist', playlist: playlist, show_tracks_count: true
end

json.curated_playlists Playlist.published.latests
  .includes(:releases, :user)
  .where(playlist_type: "playlist")
  .order("editor_choice_position asc, release_date desc, id desc")
  .limit(3) do |playlist|
    json.partial! 'playlists/playlist', playlist: playlist, show_tracks_count: true
end

json.labels @labels do |label|
  json.partial! 'labels/label', label: label
end

if @highlighted_playlist
  json.highlighted_playlist do
    json.partial! 'playlists/playlist', playlist: @highlighted_playlist, show_description: true
  end
end

json.meta do
  json.total_pages @tracks.total_pages
  json.current_page @tracks.current_page
  json.total_count @tracks.total_count
end
