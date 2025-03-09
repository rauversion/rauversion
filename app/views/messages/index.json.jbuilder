json.collection @messages do |message|
  json.id message.id
  json.body message.body
  json.message_type message.message_type
  json.created_at message.created_at
  json.read message.read
  json.user do
    json.id message.user.id
    json.username message.user.username
    json.full_name [message.user.first_name, message.user.last_name].compact.join(' ')
    json.avatar_url message.user.avatar.attached? ? url_for(message.user.avatar) : nil
  end
end

json.metadata do
  json.conversation_id @conversation.id
  json.current_page @messages.current_page
  json.total_pages @messages.total_pages
  json.total_count @messages.total_count
  json.next_page @messages.next_page
  json.prev_page @messages.prev_page
  json.per_page @messages.limit_value
  json.timestamp Time.current
end
