json.array! @conversations do |conversation|
  json.id conversation.id
  json.subject conversation.subject
  json.status conversation.status
  json.created_at conversation.created_at
  json.updated_at conversation.updated_at
  
  json.messageable do
    json.id conversation.messageable_id
    json.type conversation.messageable_type
  end

  json.participants conversation.participants do |participant|
    json.id participant.id
    json.role participant.role
    json.user do
      json.id participant.user.id
      json.username participant.user.username
      json.avatar_url participant.user.avatar.attached? ? url_for(participant.user.avatar) : nil
    end
  end

  # Include last message if exists
  if conversation.messages.any?
    json.last_message do
      last_message = conversation.messages.ordered.last
      json.id last_message.id
      json.body last_message.body
      json.message_type last_message.message_type
      json.created_at last_message.created_at
      json.user do
        json.id last_message.user.id
        json.username last_message.user.username
      end
    end
  end
end
