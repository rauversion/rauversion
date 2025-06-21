json.id user.id
json.username user.username
json.name user.full_name
json.full_name user.full_name
json.first_name user.first_name
json.last_name user.last_name
json.full_name user.full_name if defined?(show_full_name) && show_full_name
json.bio user.bio if defined?(show_bio) && show_bio
json.initials user.username.to_s.split(' ').map(&:first).join('')

json.avatar_url do
  json.small user.avatar_url(:small)
  json.medium user.avatar_url(:medium)
  json.large user.avatar_url(:large)
end
