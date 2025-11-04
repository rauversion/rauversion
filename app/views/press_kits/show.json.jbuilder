json.extract! @press_kit, :id, :bio, :press_release, :technical_rider, :stage_plot, :booking_info, :published, :settings, :use_builder, :editor_data, :created_at, :updated_at

json.user do
  json.partial! 'users/user', user: @user
end

json.photos @press_kit.photos do |photo|
  json.id photo.id
  json.url url_for(photo)
  json.filename photo.filename.to_s
  json.content_type photo.content_type
  json.byte_size photo.byte_size
end

json.documents @press_kit.documents do |document|
  json.id document.id
  json.url url_for(document)
  json.filename document.filename.to_s
  json.content_type document.content_type
  json.byte_size document.byte_size
end

# Include featured tracks if any
if @press_kit.settings['featured_track_ids'].present?
  json.featured_tracks do
    @user.tracks.where(id: @press_kit.settings['featured_track_ids']).each do |track|
      json.partial! 'tracks/track', track: track
    end
  end
end

# Include featured playlists if any
if @press_kit.settings['featured_playlist_ids'].present?
  json.featured_playlists do
    @user.playlists.where(id: @press_kit.settings['featured_playlist_ids']).each do |playlist|
      json.partial! 'playlists/playlist', playlist: playlist
    end
  end
end
