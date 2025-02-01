json.metadata do
  json.current_page @collection.current_page
  json.total_pages @collection.total_pages
  json.total_count @collection.total_count
  json.next_page @collection.next_page
  json.prev_page @collection.prev_page
  json.is_first_page @collection.first_page?
  json.is_last_page @collection.last_page?
end

json.collection @collection do |playlist|

  json.id playlist.id
  json.title playlist.title
  json.slug playlist.slug
  json.playlist_type playlist.playlist_type
  json.release_date playlist.release_date
  json.cover_url do
    json.medium playlist.cover_url(:medium)
    json.small playlist.cover_url(:small)
    json.large playlist.cover_url(:large)
  end
  json.mp3_audio_url url_for(playlist.tracks.first.mp3_audio) if playlist.tracks.first.mp3_audio.attached?
  json.url playlist_path(playlist)
  json.tracks_count playlist.tracks.count
  json.user do
    json.id playlist.user.id
    json.username playlist.user.username
    json.avatar_url do
      json.medium playlist.user.avatar_url(:medium)
      json.small playlist.user.avatar_url(:small)
      json.large playlist.user.avatar_url(:large)
    end
  end
end
