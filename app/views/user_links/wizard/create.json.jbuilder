if @user.errors.any?
  json.error @user.errors.full_messages.to_sentence
else
  json.success true
  json.message 'Social media links were successfully configured.'
  json.redirect_url user_user_links_path(username: @user.username)
end
