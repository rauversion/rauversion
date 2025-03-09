json.conversation do
  json.id @conversation.id
  json.subject @conversation.subject
  json.status @conversation.status
  json.messageable_type @conversation.messageable_type
  json.messageable_id @conversation.messageable_id
  json.created_at @conversation.created_at
  json.updated_at @conversation.updated_at

  json.participants @conversation.participants do |participant|
    json.id participant.id
    json.role participant.role
    json.user do
      json.id participant.user.id
      json.username participant.user.username
      json.full_name [participant.user.first_name, participant.user.last_name].compact.join(' ')
      json.avatar_url participant.user.avatar.attached? ? url_for(participant.user.avatar) : nil
    end
  end

  # json.messages @conversation.messages.order(created_at: :asc) do |message|
  #   json.id message.id
  #   json.body message.body
  #   json.message_type message.message_type
  #   json.created_at message.created_at
  #   json.read message.read
  #   json.user do
  #     json.id message.user.id
  #     json.username message.user.username
  #     json.full_name [message.user.first_name, message.user.last_name].compact.join(' ')
  #     json.avatar_url message.user.avatar.attached? ? url_for(message.user.avatar) : nil
  #   end
  # end

  if @conversation.messages.any?
    json.last_message do
      last_message = @conversation.messages.last
      json.id last_message.id
      json.body last_message.body
      json.message_type last_message.message_type
      json.created_at last_message.created_at
      json.read last_message.read
      json.user do
        json.id last_message.user.id
        json.username last_message.user.username
        json.avatar_url last_message.user.avatar.attached? ? url_for(last_message.user.avatar) : nil
      end
    end
  end

  # Include messageable object details if available
  if @conversation.messageable.present?
    json.messageable do
      json.id @conversation.messageable.id
      json.type @conversation.messageable_type
      
      case @conversation.messageable_type
      when 'User'
        json.username @conversation.messageable.username
        json.avatar_url @conversation.messageable.avatar.attached? ? url_for(@conversation.messageable.avatar) : nil
      when 'Product'
        json.name @conversation.messageable.name
        json.image_url @conversation.messageable.image.attached? ? url_for(@conversation.messageable.image) : nil
      # Add more types as needed
      end
    end
  end
end
