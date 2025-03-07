json.collection @messages do |message|
  json.id message.id
  json.body message.body
  json.message_type message.message_type
  json.created_at message.created_at
  json.conversation_id message.conversation.id
  json.user do
    json.id message.user.id
    json.username message.user.username
    json.avatar_url message.user.avatar.attached? ? url_for(message.user.avatar) : nil
  end
end

json.metadata do
    json.current_page @messages.current_page
    json.total_pages @messages.total_pages
    json.total_count @messages.total_count
    json.next_page @messages.next_page
    json.prev_page @messages.prev_page
    json.is_first_page @messages.first_page?
    json.is_last_page @messages.last_page?
end
