json.message do
  json.id @message.id
  json.body @message.body
  json.message_type @message.message_type
  json.created_at @message.created_at
  json.user do
    json.id @message.user.id
    json.username @message.user.username
    json.avatar_url @message.user.avatar.attached? ? url_for(@message.user.avatar) : nil
  end
end

json.meta do
  json.conversation_id @message.conversation_id
  json.status 'created'
end
