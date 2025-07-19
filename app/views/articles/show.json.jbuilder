json.id @post.id
json.slug @post.slug
json.title @post.title
json.excerpt @post.excerpt
json.body @post.body # serialized_to_html(@post.body.with_indifferent_access)&.html_safe
json.created_at @post.created_at
json.updated_at @post.updated_at
json.state @post.state
json.reading_time @post.settings["reading_time"]
json.cover_url do
  json.medium @post.cover_url(:medium)
  json.small @post.cover_url(:small)
  json.large @post.cover_url(:large)
  json.horizontal @post.cover_url(:horizontal)
end

if @post.category
  json.category do
    json.id @post.category.id
    json.name @post.category.name
    json.slug @post.category.slug
  end
end

json.tags @post.tags

json.author do
  json.partial! 'users/user', user: @post.user, show_full_name: true
end
