json.user do
  json.partial! 'users/user', user: @user, show_full_name: true
end

json.collection @user_links do |link|
  json.extract! link, :id, :title, :url, :type, :icon_class
  json.created_at link.created_at
  json.updated_at link.updated_at
  json.can_edit current_user == @user
end


json.metadata do
  json.partial! 'shared/pagination_metadata', collection: @user_links
end

