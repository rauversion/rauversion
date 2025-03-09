class Conversation < ApplicationRecord
  belongs_to :messageable, polymorphic: true
  has_many :messages, dependent: :destroy
  has_many :participants, dependent: :destroy
  has_many :users, through: :participants

  validates :subject, presence: true
  validates :status, presence: true, inclusion: { in: %w[active archived closed] }

  scope :active, -> { where(status: 'active') }
  scope :archived, -> { where(status: 'archived') }
  scope :closed, -> { where(status: 'closed') }

  def participant?(user)
    participants.exists?(user: user)
  end

  def add_participant(user, role = 'member')
    participants.create(user: user, role: role)
  end

  def owner
    participants.find_by(role: 'owner')&.user
  end

  def members
    participants.where(role: 'member').includes(:user).map(&:user)
  end

  def mark_as_read!(user)
    messages.unread_by(user).update_all(read: true)
  end
end
