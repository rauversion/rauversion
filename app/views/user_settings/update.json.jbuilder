json.user do
  json.id @user.id
  json.username @user.username
  json.first_name @user.first_name
  json.last_name @user.last_name
  json.bio @user.bio
  json.country @user.country
  json.city @user.city
  # json.website @user.website
  json.hide_username_from_profile @user.hide_username_from_profile
  json.avatar_url do
    json.small @user.avatar_url(:small)
    json.medium @user.avatar_url(:medium)
    json.large @user.avatar_url(:large)
  end
  json.profile_header_url do
    json.small @user.profile_header_url(:small)
    json.medium @user.profile_header_url(:medium)
    json.large @user.profile_header_url(:large)
  end
end

json.errors @user.errors

