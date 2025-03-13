json.id user.id
json.username user.username
json.full_name user.full_name if defined?(show_full_name) && show_full_name
json.avatar_url do
  json.medium user.avatar_url(:medium)
  json.small user.avatar_url(:small)
end
