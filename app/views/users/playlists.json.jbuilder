json.collection @collection do |playlist|
  json.partial! 'playlists/playlist', playlist: playlist, 
    show_details: true, 
    show_tracks: true, 
    show_user_bio: true,
    show_large: true
end

json.metadata do
  json.partial! 'shared/pagination_metadata', collection: @collection
end
