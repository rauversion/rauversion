json.message do
  json.id @message.id
  json.body @message.body
  json.message_type @message.message_type
  json.created_at @message.created_at
  json.read false # New messages are always unread for recipients
  json.user do
    json.partial! 'users/user', user: @message.user, show_full_name: true
  end
end

json.meta do
  json.conversation_id @message.conversation_id
  json.status 'created'
  json.timestamp Time.current
end
