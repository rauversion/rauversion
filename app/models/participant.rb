class Participant < ApplicationRecord
  belongs_to :conversation
  belongs_to :user

  validates :role, presence: true, inclusion: { in: %w[owner member] }
  validates :user_id, uniqueness: { scope: :conversation_id }

  scope :owners, -> { where(role: 'owner') }
  scope :members, -> { where(role: 'member') }

  def can_manage?
    role == 'owner'
  end

  def owner?
    role == 'owner'
  end

  def member?
    role == 'member'
  end

  after_create_commit :broadcast_to_user

  private

  def broadcast_to_user
    NotificationsChannel.broadcast_to(
      user,
      {
        type: 'new_conversation',
        conversation: {
          id: conversation.id,
          subject: conversation.subject,
          status: conversation.status,
          messageable_type: conversation.messageable_type,
          messageable_id: conversation.messageable_id,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          participants: conversation.participants.map { |p|
            {
              id: p.id,
              role: p.role,
              user: {
                id: p.user.id,
                username: p.user.username,
                full_name: [p.user.first_name, p.user.last_name].compact.join(' '),
                avatar_url: p.user.avatar.attached? ? Rails.application.routes.url_helpers.url_for(p.user.avatar) : nil
              }
            }
          }
        }
      }
    )
  end
end
