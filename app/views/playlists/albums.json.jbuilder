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
  if playlist.cover.attached?
    json.cover_urls do
      json.medium rails_storage_proxy_url(playlist.cover.variant(resize_to_limit: [400, 400]))
      json.large rails_storage_proxy_url(playlist.cover.variant(resize_to_limit: [1200, 1200]))
    end
  end
  json.url playlist_path(playlist)
end
