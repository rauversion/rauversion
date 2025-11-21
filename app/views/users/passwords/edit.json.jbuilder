json.reset_password do
  json.reset_password_token params[:reset_password_token]
  json.minimum_password_length @minimum_password_length if defined?(@minimum_password_length)
end
