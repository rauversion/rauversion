unless params[:ids].present?
  json.metadata do
    json.partial! 'shared/pagination_metadata', collection: @playlists
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
