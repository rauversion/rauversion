json.collection @artists do |artist|
  json.extract! artist, :id, :username, :full_name, :bio

  json.partial! 'users/user', user: artist, show_full_name: true

  json.tracks_count artist.tracks.size
  json.albums_count artist.playlists.albums.size
  #json.followers_count artist.followers.size
end

json.metadata do
  json.partial! 'shared/pagination_metadata', collection: @artists
end
