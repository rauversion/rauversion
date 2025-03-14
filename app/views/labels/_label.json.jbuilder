json.id label.id
json.username label.username
json.full_name label.full_name
json.avatar_url do
  json.medium label.avatar_url(:medium)
  json.small label.avatar_url(:small)
end
json.playlists_count label.playlists.count
