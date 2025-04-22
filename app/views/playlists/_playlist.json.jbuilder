json.id playlist.id
json.title playlist.title
json.slug playlist.slug
json.description playlist.description if defined?(show_description) && show_description
json.playlist_type playlist.playlist_type if defined?(show_details) && show_details
json.private playlist.private if defined?(show_details) && show_details
json.release_date playlist.release_date if defined?(show_details) && show_details
json.editor_choice_position playlist.editor_choice_position if defined?(show_details) && show_details
json.created_at playlist.created_at if defined?(show_details) && show_details
json.updated_at playlist.updated_at if defined?(show_details) && show_details

unless playlist.price.nil?
  json.formatted_price number_to_currency(playlist.price)
  json.price playlist.price 
end
json.name_your_price playlist.name_your_price


json.mp3_audio_url url_for(playlist.tracks.first.mp3_audio) if playlist.tracks.first&.mp3_audio&.attached?
json.url playlist_path(playlist)

json.cover_url do
  if playlist.cover.attached?
    json.small playlist.cover_url(:small)
    json.medium playlist.cover_url(:medium)
    json.large playlist.cover_url(:large) if defined?(show_large) && show_large
    json.cropped_image url_for(playlist.cropped_image)
  else
    json.small "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png"
    json.medium "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png"
    json.large "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png" if defined?(show_large) && show_large
    json.cropped_image "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png"
  end
end

json.tracks_count playlist.tracks.size if defined?(show_tracks_count) && show_tracks_count

if defined?(show_tracks) && show_tracks
  json.tracks playlist.track_playlists.by_position do |track_playlist|
    track = track_playlist.track
    json.partial! 'tracks/track', track: track
  end
end

json.user do
  json.partial! 'users/user', user: playlist.user, show_bio: defined?(show_user_bio) && show_user_bio
end
