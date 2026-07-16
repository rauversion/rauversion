json.user do
  json.username @user.username
  json.display_name @user.display_name
  json.avatar_url @user.avatar_url(:large)
end

json.configured @user.radio_configured?
json.stream_url @user.radio_stream_url if @user.radio_configured?
json.editable current_user == @user
