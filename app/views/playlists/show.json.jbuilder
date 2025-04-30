json.playlist do
  json.id @playlist.id
  json.title @playlist.title
  json.description @playlist.description
  json.slug @playlist.slug
  json.playlist_type @playlist.playlist_type
  json.private @playlist.private
  json.release_date @playlist.release_date
  json.editor_choice_position @playlist.editor_choice_position
  json.created_at @playlist.created_at
  json.updated_at @playlist.updated_at
  json.price @playlist.price
  json.name_your_price @playlist.name_your_price
  json.formatted_price number_to_currency(@playlist.price)
  json.label do
    json.partial! 'users/user', user: @playlist.label, show_full_name: true
  end if @playlist.label_id.present?

  json.user do
    json.partial! 'users/user', user: @playlist.user, show_full_name: true
  end

  json.cover_url do
    if @playlist.cover.attached?
      json.small @playlist.cover_url(:small)
      json.medium @playlist.cover_url(:medium)
      json.large @playlist.cover_url(:large)
      json.original @playlist.cover_url(:original)
      json.cropped_image url_for(@playlist.cropped_image)
    else
      json.small AlbumsHelper.default_image_sqr
      json.medium AlbumsHelper.default_image_sqr
      json.large AlbumsHelper.default_image_sqr
    end
  end


  json.tracks @playlist.track_playlists.order("position asc") do |track_playlist|
    track = track_playlist.track
    json.partial! 'tracks/track', track: track
  end
end
