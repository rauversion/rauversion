json.collection @messages do |message|
  json.id message.id
  json.body message.body
  json.message_type message.message_type
  json.created_at message.created_at
  json.read message.read_by?(@conversation.participants.find_by(user: current_user))
  json.user do
    json.partial! 'users/user', user: messager.user, show_full_name: true
  end
end

json.metadata do
  json.conversation_id @conversation.id
  json.timestamp Time.current
  json.partial! 'shared/pagination_metadata', collection: @messages
end
