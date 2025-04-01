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
      json.partial! 'users/user', user: participant.user, show_full_name: true
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
        json.partial! 'users/user', user: last_message.user, show_full_name: true
      end
    end
  end
end
