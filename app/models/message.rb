class Message < ApplicationRecord
  belongs_to :conversation
  belongs_to :user

  validates :body, presence: true
  validates :message_type, presence: true, inclusion: { in: %w[text system] }

  scope :ordered, -> { order(created_at: :asc) }
  scope :unread_by, ->(user) { where(read: false).where.not(user: user) }

  after_create_commit :broadcast_to_conversation

  private

  def broadcast_to_conversation
    ConversationChannel.broadcast_to(
      conversation,
      {
        type: 'new_message',
        message: {
          id: id,
          body: body,
          message_type: message_type,
          created_at: created_at,
          read: read,
          user: {
            id: user.id,
            username: user.username,
            full_name: [user.first_name, user.last_name].compact.join(' '),
            avatar_url: user.avatar.attached? ? Rails.application.routes.url_helpers.url_for(user.avatar) : nil
          }
        }
      }
    )

    # Also broadcast to each participant's notifications channel
    conversation.participants.each do |participant|
      next if participant.user_id == user_id # Skip sender

      NotificationsChannel.broadcast_to(
        participant.user,
        {
          type: 'new_message',
          conversation_id: conversation_id,
          message: {
            id: id,
            body: body,
            message_type: message_type,
            created_at: created_at,
            read: read,
            user: {
              id: user.id,
              username: user.username,
              full_name: [user.first_name, user.last_name].compact.join(' '),
              avatar_url: user.avatar.attached? ? Rails.application.routes.url_helpers.url_for(user.avatar) : nil
            }
          }
        }
      )
    end
  end
end
