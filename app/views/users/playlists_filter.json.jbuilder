json.collection @playlists do |playlist|
  json.extract! playlist, :id, :title, :description, :playlist_type, :private, :slug, :created_at
  json.cover_url do
    json.small playlist.cover_url(:small)
    json.medium playlist.cover_url(:medium)
    json.large playlist.cover_url(:large)
  end
  json.tracks_count playlist.tracks.count
  json.user do
    json.extract! playlist.user, :id, :username, :first_name, :last_name
    json.full_name "#{playlist.user.first_name} #{playlist.user.last_name}"
  end
end

json.filter do
  json.kind @kind
end

json.metadata do
  json.current_page @playlists.current_page
  json.total_pages @playlists.total_pages
  json.total_count @playlists.total_count
  json.next_page @playlists.next_page
  json.prev_page @playlists.prev_page
  json.is_first_page @playlists.first_page?
  json.is_last_page @playlists.last_page?
end
