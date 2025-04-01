json.user do
  json.partial! 'users/user', user: @user, show_full_name: true
end

if @podcaster_info
  json.podcaster_info do
    json.id @podcaster_info.id
    json.title @podcaster_info.title
    json.description @podcaster_info.description
    json.about @podcaster_info.about
    json.highlight @podcaster_info.highlight
    json.active @podcaster_info.active
    json.avatar_url @podcaster_info.avatar.url if @podcaster_info.avatar.present?
    
    json.hosts @podcaster_info.hosts do |host|
      json.id host.id
      json.username host.username
      json.avatar_url host.avatar_url
      json.role host.podcaster_hosts.find_by(podcaster_info: @podcaster_info)&.role
    end
  end
end
