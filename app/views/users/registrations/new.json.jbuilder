
json.invisible_captcha do
  json.timestamp Time.current.to_i
  json.field_name InvisibleCaptcha.get_honeypot
end

json.user do
  json.id @user.id
  json.email @user.email
  json.first_name @user.first_name
  json.last_name @user.last_name
  json.username @user.username
  json.avatar @user.avatar
end
