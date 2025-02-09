json.event do
  json.id @event.id
  json.slug @event.slug
  json.participant_label @event.participant_label
  json.participant_description @event.participant_description
  
  json.event_hosts @event.event_hosts.includes(:user) do |host|
    json.id host.id
    json.name host.name
    json.description host.description
    json.listed_on_page host.listed_on_page
    json.event_manager host.event_manager
    json.created_at host.created_at
    
    json.user do
      json.id host.user.id
      json.email host.user.email
      json.full_name host.user.full_name
      json.username host.user.username
      json.avatar_url do
        json.medium host.user.avatar_url(:medium)
        json.small host.user.avatar_url(:small)
      end
    end
  end
end
