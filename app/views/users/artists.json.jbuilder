json.artists @artists do |artist|
  json.extract! artist, :id, :username, :first_name, :last_name, :role, :created_at
  json.avatar_url do
    json.small artist.avatar_url(:small)
    json.medium artist.avatar_url(:medium)
    json.large artist.avatar_url(:large)
  end
  json.tracks_count artist.tracks.size
end

json.label do
  json.extract! @label, :id, :username, :first_name, :last_name
  json.avatar_url do
    json.small @label.avatar_url(:small)
    json.medium @label.avatar_url(:medium)
    json.large @label.avatar_url(:large)
  end
end

json.pagination do
  json.current_page @artists.current_page
  json.total_pages @artists.total_pages
  json.total_count @artists.total_count
end
