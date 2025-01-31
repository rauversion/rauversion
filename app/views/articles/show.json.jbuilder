json.id @post.id
json.slug @post.slug
json.title @post.title
json.excerpt @post.excerpt
json.body serialized_to_html(@post.body.with_indifferent_access)&.html_safe
json.created_at @post.created_at
json.updated_at @post.updated_at
json.state @post.state
json.reading_time @post.settings["reading_time"]
json.cover_image @post.cropped_image

if @post.category
  json.category do
    json.id @post.category.id
    json.name @post.category.name
    json.slug @post.category.slug
  end
end

json.tags @post.tags

json.author do
  json.username @post.user.username
  json.name @post.user.full_name
  json.avatar @post.user.avatar_url(:small)
end
