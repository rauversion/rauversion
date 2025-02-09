json.collection @tracks do |track|
  json.id track.id
  json.title track.title
  json.description track.description
  json.cover_url do
    json.small track.cover_url(:small)
    json.medium track.cover_url(:medium)
    json.large track.cover_url(:large)
  end
end
