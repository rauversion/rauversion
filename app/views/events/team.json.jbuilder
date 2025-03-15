json.event do
  json.id @event.id
  json.slug @event.slug
  json.participant_label @event.participant_label
  json.participant_description @event.participant_description
  
  # Current team members
  json.event_hosts @event.event_hosts.includes(:user) do |host|
    json.id host.id
    json.name host.name
    json.description host.description
    json.listed_on_page host.listed_on_page
    json.event_manager host.event_manager
    json.created_at host.created_at
    
    json.user do
      json.partial! 'users/user', user: host.user, show_full_name: true
    end
  end

  # Pending invitations
  json.pending_invites User.where(invitation_token: nil).where.not(invitation_sent_at: nil).joins(:event_hosts).where(event_hosts: { event_id: @event.id }) do |user|
    json.id user.id
    json.email user.email
    json.role user.event_hosts.find_by(event_id: @event.id).role
    json.created_at user.invitation_sent_at
  end
end
