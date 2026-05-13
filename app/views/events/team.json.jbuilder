json.event do
  json.id @event.id
  json.slug @event.slug
  json.participant_label @event.participant_label
  json.participant_description @event.participant_description
  
  # Current team members
  json.event_hosts @event.event_hosts.includes(:user) do |host|
    json.id host.id
    json.name host.name
    json.display_name host.name.presence || host.user&.display_name.presence || host.user&.email
    json.email host.user&.email
    json.user_id host.user_id
    json.record_type host.user.present? ? "user" : "event_data"
    json.invitation_pending host.user.present? && host.user.invitation_sent_at.present? && host.user.invitation_accepted_at.blank?
    json.description host.description
    json.listed_on_page host.listed_on_page
    json.event_manager host.event_manager
    json.access_role host.access_role
    if host.avatar.attached?
      json.avatar_url do
        json.small host.avatar_url(:small)
        json.medium host.avatar_url(:medium)
        json.large host.avatar_url(:large)
      end
    end
    json.created_at host.created_at
    
    if host.user.present?
      json.user do
        json.partial! 'users/user', user: host.user, show_full_name: true
        json.email host.user.email
      end
    else
      json.user nil
    end
  end

  # Pending invitations
  json.pending_invites User.where(invitation_token: nil).where.not(invitation_sent_at: nil).joins(:event_hosts).where(event_hosts: { event_id: @event.id }) do |user|
    json.id user.id
    json.email user.email
    json.role user.event_hosts.find_by(event_id: @event.id)&.access_role
    json.created_at user.invitation_sent_at
  end
end
