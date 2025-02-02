json.invitations @invitations do |invitation|
  json.id invitation.id
  json.email invitation.email
  json.username invitation.username
  json.created_at invitation.created_at
  json.accepted_at invitation.invitation_accepted_at
  json.sent_at invitation.invitation_sent_at
  json.status invitation.invitation_accepted? ? "accepted" : (invitation.invitation_sent_at ? "pending" : "not_sent")
  
  # Additional user details if they've accepted
  if invitation.invitation_accepted?
    json.avatar_url invitation.avatar_url
    json.profile_url invitation.profile_url if invitation.respond_to?(:profile_url)
  end
  
  json.inviter do
    json.id invitation.invited_by_id
    json.email invitation.invited_by.email if invitation.invited_by
    json.username invitation.invited_by.username if invitation.invited_by
  end
end

json.meta do
  json.total_count @invitations.count
  json.invitations_count current_user.invitations_count
  json.invitations_left current_user.has_invitations_left?
end
