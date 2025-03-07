class Message < ApplicationRecord
  belongs_to :conversation
  belongs_to :user

  validates :body, presence: true
  validates :message_type, presence: true, inclusion: { in: %w[text system] }
  
  after_create :notify_participants

  scope :ordered, -> { order(created_at: :asc) }
  scope :text_messages, -> { where(message_type: 'text') }
  scope :system_messages, -> { where(message_type: 'system') }

  private

  def notify_participants
    # Here we could add notification logic later
    # For example, sending emails or push notifications
    # to other participants in the conversation
  end
end
