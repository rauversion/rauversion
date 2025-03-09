class Message < ApplicationRecord
  belongs_to :conversation
  belongs_to :user

  has_many :message_reads, dependent: :destroy
  has_many :reading_participants, through: :message_reads, source: :participant

  validates :body, presence: true
  validates :message_type, presence: true, inclusion: { in: %w[text system] }

  scope :ordered, -> { order(created_at: :asc) }
  scope :unread_by, ->(participant) {
    left_joins(:message_reads)
      .where(message_reads: { id: nil })
      .or(Message.left_joins(:message_reads).where.not(message_reads: { participant_id: participant.id }))
      .where.not(user_id: participant.user_id)
      .distinct
  }

  after_create_commit :broadcast_to_conversation

  def mark_as_read_by(participant)
    message_reads.create_or_find_by(participant: participant) do |mr|
      mr.read_at = Time.current
    end
  end

  def read_by?(participant)
    message_reads.exists?(participant: participant)
  end

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
          read: false, # New messages are always unread for recipients
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
    conversation.participants.find_each do |participant|
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
            read: false, # New messages are always unread for recipients
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
