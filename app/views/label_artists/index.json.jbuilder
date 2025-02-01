json.collection @artists do |artist|
  json.extract! artist, :id, :username, :full_name, :bio
  
  if artist.avatar.attached?
    json.avatar_url rails_blob_url(artist.avatar)
  end

  json.tracks_count artist.tracks.size
  json.albums_count artist.playlists.albums.size
  #json.followers_count artist.followers.size
end

json.metadata do
  json.current_page @artists.current_page
  json.total_pages @artists.total_pages
  json.total_count @artists.total_count
  json.next_page @artists.next_page
  json.prev_page @artists.prev_page
  json.is_first_page @artists.first_page?
  json.is_last_page @artists.last_page?
end
