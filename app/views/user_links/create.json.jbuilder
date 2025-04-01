json.link do
  json.id @user_link.id
  json.title @user_link.title
  json.url @user_link.url
  json.icon_class @user_link.icon_class
  json.type @user_link.type
  json.position @user_link.position
  json.can_edit true
  json.created_at @user_link.created_at
  json.updated_at @user_link.updated_at
end

json.message "Link was successfully created."
