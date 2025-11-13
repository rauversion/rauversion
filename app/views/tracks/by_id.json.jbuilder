json.collection @tracks do |track|
  json.id track.id
  json.title track.title
  json.slug track.slug

  json.user do
    json.username track.user.username
  end

  json.cover_url do
    if track.cover.attached?
      json.small track.cover_url(:small)
      json.medium track.cover_url(:medium)
      json.large track.cover_url(:large)
    else
      json.small track.user.avatar_url(:small)
      json.medium track.user.avatar_url(:medium)
      json.large track.user.avatar_url(:large)
    end
  end
end
