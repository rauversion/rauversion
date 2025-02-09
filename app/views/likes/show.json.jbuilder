json.liked @liked
json.resource do
  json.type @resource.class.name.downcase
  json.id @resource.id
  json.slug @resource.slug
  json.likes_count @resource.likes.count
end
