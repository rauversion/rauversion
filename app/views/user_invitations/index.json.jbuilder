json.collection @invitations do |invitation|
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

json.metadata do
  json.current_page @invitations.current_page
  json.total_pages @invitations.total_pages
  json.total_count @invitations.total_count
  json.next_page @invitations.next_page
  json.prev_page @invitations.prev_page
  json.is_first_page @invitations.first_page?
  json.is_last_page @invitations.last_page?
end
