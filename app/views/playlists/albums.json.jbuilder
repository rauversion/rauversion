unless params[:ids].present?
  json.metadata do
    json.current_page @playlists.current_page
    json.total_pages @playlists.total_pages
    json.total_count @playlists.total_count
    json.next_page @playlists.next_page
    json.prev_page @playlists.prev_page
    json.is_first_page @playlists.first_page?
    json.is_last_page @playlists.last_page?
  end
end

json.collection @playlists do |playlist|
  json.id playlist.id
  json.title playlist.title
  json.description playlist.description
  json.tracks_count playlist.tracks&.count || 0
  json.cover_url rails_blob_url(playlist.cover.variant(resize_to_fill: [400, 400])) if playlist.cover.attached?
  json.url playlist_path(playlist)
end
