json.selected_services @selected_services

json.user_links @user.user_links.select(&:new_record?) do |link|
  json.type link.type
  json.username link.username
  json.custom_url link.custom_url
  json.title link.title
  json.id link.id
end

if flash[:error].present?
  json.error flash[:error]
end
