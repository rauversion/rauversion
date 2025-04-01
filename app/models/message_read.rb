class MessageRead < ApplicationRecord
  belongs_to :message
  belongs_to :participant

  validates :message_id, uniqueness: { scope: :participant_id }
  validates :read_at, presence: true
end
