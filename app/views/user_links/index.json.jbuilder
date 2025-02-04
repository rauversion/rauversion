json.user do
  json.extract! @user, :id, :username
  json.social_title @user.social_title
  json.social_description @user.social_description
  json.avatar_url do
    json.small @user.avatar_url(:small)
    json.medium @user.avatar_url(:medium)
    json.large @user.avatar_url(:large)
  end
end

json.links @user_links do |link|
  json.extract! link, :id, :title, :url, :type, :icon_class
  json.created_at link.created_at
  json.updated_at link.updated_at
  json.can_edit current_user == @user
end
