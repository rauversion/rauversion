json.collection @artists do |artist|
  json.extract! artist, :id, :username, :full_name, :first_name, :last_name, :role, :created_at
  json.avatar_url do
    json.small artist.avatar_url(:small)
    json.medium artist.avatar_url(:medium)
    json.large artist.avatar_url(:large)
  end
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
