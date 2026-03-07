json.collection @playlists do |playlist|
  json.partial! "playlists/playlist",
    playlist: playlist,
    show_details: true,
    show_tracks: true,
    show_large: true,
    show_tracks_count: true,
    show_user_bio: true
end

json.filter do
  json.kind @kind
end

json.metadata do
  json.partial! 'shared/pagination_metadata', collection: @playlists
end
