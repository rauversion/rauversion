json.id @release.id
json.slug @release.slug
json.title @release.title
# json.description @release.description
json.editor_data @release.editor_data



json.release_playlists @release.release_playlists do |release_playlist|
  json.id release_playlist.id
  json.playlist_id release_playlist.playlist_id
  json.position release_playlist.position

  json.id release_playlist.playlist.id
  json.title release_playlist.playlist.title
  json.tracks_count release_playlist.playlist.tracks&.count || 0
  json.cover_url rails_blob_url(release_playlist.playlist.cover) if release_playlist.playlist.cover.attached?
  json.url playlist_path(release_playlist.playlist)
end
