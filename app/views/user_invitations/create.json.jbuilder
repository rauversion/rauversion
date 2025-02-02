json.invitation do
  json.id @invitation.id
  json.email @invitation.email
  json.created_at @invitation.created_at
  json.accepted_at @invitation.invitation_accepted_at
  json.sent_at @invitation.invitation_sent_at
  json.status @invitation.invitation_accepted? ? "accepted" : (@invitation.invitation_sent_at ? "pending" : "not_sent")
  json.inviter do
    json.id @invitation.invited_by_id
    json.email @invitation.invited_by.email if @invitation.invited_by
  end
end

json.errors @invitation.errors
  

json.user do
  json.invitations_count current_user.invitations_count
  json.invitations_left current_user.has_invitations_left?
end
