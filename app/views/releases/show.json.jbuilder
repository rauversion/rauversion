json.id @release.id
json.slug @release.slug
json.title @release.title
json.subtitle @release.subtitle
json.editor_data @release.editor_data
json.created_at @release.created_at
json.updated_at @release.updated_at
json.playlist_id @release.playlist_id
json.published @release.published

if @release.cover.attached?
  json.cover_url rails_blob_url(@release.cover.variant(resize_to_fill: [1200, 1200]))
end

json.colors do
  json.cover @release.cover_color
  json.record @release.record_color
  json.sleeve @release.sleeve_color
end

json.links do
  json.spotify @release.spotify
  json.bandcamp @release.bandcamp
  json.soundcloud @release.soundcloud
end

json.user do
  json.partial! 'users/user', user: @release.user, show_full_name: true
end

json.release_playlists @release.release_playlists.order(:position) do |release_playlist|
  json.id release_playlist.id
  json.playlist_id release_playlist.playlist_id
  json.position release_playlist.position

  json.playlist do
    json.id release_playlist.playlist.id
    json.title release_playlist.playlist.title
    json.tracks_count release_playlist.playlist.tracks&.count || 0
    if release_playlist.playlist.cover.attached?
      json.cover_url rails_blob_url(release_playlist.playlist.cover.variant(resize_to_fill: [1200, 1200]))
    end
    json.url playlist_path(release_playlist.playlist)
  end
end

json.urls do
  json.show release_path(@release)
  json.edit edit_release_path(@release)
  json.editor editor_release_path(@release)
end
