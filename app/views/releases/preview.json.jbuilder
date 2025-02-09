json.id @release.id
json.slug @release.slug
json.title @release.title
json.subtitle @release.subtitle
json.editor_data @release.editor_data

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
  json.id @release.user.id
  json.username @release.user.username
  json.name @release.user.name
  if @release.user.avatar.attached?
    json.avatar_url rails_blob_url(@release.user.avatar.variant(resize_to_fill: [100, 100]))
  end
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
    json.position track.position
    
    if track.audio.attached?
      json.audio_url rails_blob_url(track.audio)
      json.waveform_url rails_blob_url(track.waveform) if track.waveform.attached?
    end
    
    if track.cover.attached?
      json.cover_url rails_blob_url(track.cover.variant(resize_to_fill: [400, 400]))
    end
    
    json.artist do
      json.id track.user.id
      json.username track.user.username
      json.name track.user.name
      if track.user.avatar.attached?
        json.avatar_url rails_blob_url(track.user.avatar.variant(resize_to_fill: [100, 100]))
      end
    end
  end
end

json.urls do
  json.show release_path(@release)
  json.edit edit_release_path(@release) if current_user == @release.user
  json.editor editor_release_path(@release) if current_user == @release.user
end
