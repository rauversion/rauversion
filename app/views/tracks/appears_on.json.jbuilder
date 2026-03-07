json.playlists @playlists do |playlist|
  json.id playlist.id
  json.title playlist.title
  json.slug playlist.slug
  json.playlist_type playlist.playlist_type.presence || "playlist"
  json.release_date playlist.release_date
  json.private playlist.private
  json.tracks_count playlist.track_playlists.size

  json.user do
    json.partial! "users/user", user: playlist.user, show_full_name: true
  end

  json.cover_url do
    if playlist.cover.attached?
      json.small playlist.cover_url(:small)
      json.medium playlist.cover_url(:medium)
      json.cropped_image url_for(playlist.cropped_image)
    else
      json.small AlbumsHelper.default_image_sqr
      json.medium AlbumsHelper.default_image_sqr
      json.cropped_image AlbumsHelper.default_image_sqr
    end
  end
end
