json.collection @artists do |artist|
  profile = artist.tenant_profile_for(Current.tenant)
  json.extract! artist, :id, :role, :created_at, :featured, :label
  json.username profile&.username
  json.full_name [profile&.first_name, profile&.last_name].compact.join(" ")
  json.first_name profile&.first_name
  json.last_name profile&.last_name
  json.city profile&.city
  json.country profile&.country
  json.bio profile&.bio
  json.display_name profile&.display_name
  json.tracks_count artist.read_attribute(:tracks_count).to_i
  json.followers_count artist.read_attribute(:followers_count).to_i
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
