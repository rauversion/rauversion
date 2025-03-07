json.conversation do
  json.id @conversation.id
  json.subject @conversation.subject
  json.status @conversation.status
  json.created_at @conversation.created_at
  json.updated_at @conversation.updated_at

  json.messageable do
    json.id @conversation.messageable_id
    json.type @conversation.messageable_type
  end

  json.participants @conversation.participants do |participant|
    json.id participant.id
    json.role participant.role
    json.user do
      json.id participant.user.id
      json.username participant.user.username
      json.avatar_url participant.user.avatar.attached? ? url_for(participant.user.avatar) : nil
    end
  end

  json.messages @conversation.messages.ordered.includes(:user) do |message|
    json.id message.id
    json.body message.body
    json.message_type message.message_type
    json.created_at message.created_at
    json.user do
      json.id message.user.id
      json.username message.user.username
      json.avatar_url message.user.avatar.attached? ? url_for(message.user.avatar) : nil
    end
  end
end
