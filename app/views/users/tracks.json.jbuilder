json.tracks @tracks do |track|
  json.extract! track, :id, :title, :description, :duration, :slug, :created_at
  json.cover_url do
    json.small track.cover_url(:small)
    json.medium track.cover_url(:medium)
    json.large track.cover_url(:large)
  end
  json.user do
    json.extract! track.user, :id, :username, :first_name, :last_name
    json.full_name "#{track.user.first_name} #{track.user.last_name}"
  end
end

json.pagination do
  json.current_page @tracks.current_page
  json.total_pages @tracks.total_pages
  json.total_count @tracks.total_count
end
