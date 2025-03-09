json.array! @conversations do |conversation|
  json.id conversation.id
  json.subject conversation.subject
  json.status conversation.status
  json.messageable_type conversation.messageable_type
  json.messageable_id conversation.messageable_id
  json.created_at conversation.created_at
  json.updated_at conversation.updated_at

  json.participants conversation.participants do |participant|
    json.id participant.id
    json.role participant.role
    json.user do
      json.id participant.user.id
      json.username participant.user.username
      json.full_name [participant.user.first_name, participant.user.last_name].compact.join(' ')
      json.avatar_url participant.user.avatar.attached? ? url_for(participant.user.avatar) : nil
    end
  end

  if conversation.messages.any?
    json.last_message do
      last_message = conversation.messages.last
      json.id last_message.id
      json.body last_message.body
      json.message_type last_message.message_type
      json.created_at last_message.created_at
      json.read last_message.read_by?(conversation.participants.find_by(user: current_user))
      json.user do
        json.id last_message.user.id
        json.username last_message.user.username
        json.avatar_url last_message.user.avatar.attached? ? url_for(last_message.user.avatar) : nil
      end
    end
  end
end
