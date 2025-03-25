json.user do
  json.username @user.username
  json.social_title @user.social_title
  json.social_description @user.social_description
  json.avatar_url do
    json.medium @user.avatar_url(:medium)
  end
end

json.links @user_links do |link|
  json.id link.id
  json.title link.title
  json.url link.url
  json.icon_class link.icon_class
  json.type link.type
  json.position link.position
  json.can_edit current_user&.id == @user.id
  json.created_at link.created_at
  json.updated_at link.updated_at
end
