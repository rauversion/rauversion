json.collection @collection do |playlist|

  json.extract! playlist, :id, :title, :description, :playlist_type, :private, :slug, :created_at
  json.slug playlist.slug
  json.playlist_type playlist.playlist_type
  json.release_date playlist.release_date
  json.price number_to_currency(playlist.price) unless playlist.price.nil?
  json.name_your_price playlist.name_your_price

  json.private playlist.private
  json.cover_url do
    json.medium playlist.cover_url(:medium)
    json.small playlist.cover_url(:small)
    json.large playlist.cover_url(:large)
  end
  json.mp3_audio_url url_for(playlist.tracks.first.mp3_audio) if playlist.tracks.first&.mp3_audio&.attached?
  json.url playlist_path(playlist)
  json.tracks_count playlist.tracks.count
  json.user do
    json.partial! 'users/user', user: playlist.user, show_full_name: true
  end

  json.tracks playlist.track_playlists.by_position do |track_playlist|
    track = track_playlist.track
    json.partial! 'tracks/track', track: track
  end
end

json.metadata do
  json.partial! 'shared/pagination_metadata', collection: @collection
end
