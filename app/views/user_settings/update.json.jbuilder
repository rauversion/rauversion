json.user do
  json.id @user.id
  json.username @user.username
  json.display_name @tenant_profile.display_name
  json.first_name @tenant_profile.first_name
  json.last_name @tenant_profile.last_name
  json.bio @tenant_profile.bio
  json.country @tenant_profile.country
  json.city @tenant_profile.city
  json.stripe_account_id @user.stripe_account_id
  json.radio_stream_url @user.radio_stream_url
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
