json.id @release.id
json.slug @release.slug
json.title @release.title
json.subtitle @release.subtitle
json.editor_data @release.editor_data
json.playlist_id @release.playlist_id

if @release.cover.attached?
  json.cover_url rails_blob_url(@release.cover.variant(resize_to_fill: [1200, 1200]))
end

json.colors do
  json.cover @release.cover_color
  json.record @release.record_color
  json.sleeve @release.sleeve_color
end

json.playlists @release.release_playlists.order(:position) do |release_playlist|
  json.id release_playlist.playlist.id
  json.title release_playlist.playlist.title
  json.position release_playlist.position
  
  if release_playlist.playlist.cover.attached?
    json.cover_url rails_blob_url(release_playlist.playlist.cover.variant(resize_to_fill: [1200, 1200]))
  end
  
  json.tracks release_playlist.playlist.tracks do |track|
    json.id track.id
    json.title track.title
    json.duration track.duration
    if track.audio.attached?
      json.audio_url rails_blob_url(track.audio)
    end
    if track.cover.attached?
      json.cover_url rails_blob_url(track.cover.variant(resize_to_fill: [400, 400]))
    end
  end
end

json.urls do
  json.show release_path(@release)
  json.edit edit_release_path(@release)
  json.update release_path(@release)
  json.upload_image upload_puck_image_releases_path
end
