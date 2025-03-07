class Participant < ApplicationRecord
  belongs_to :user
  belongs_to :conversation

  validates :role, presence: true, inclusion: { in: %w[owner member admin] }
  validates :user_id, uniqueness: { scope: :conversation_id, message: "is already a participant" }

  scope :owners, -> { where(role: 'owner') }
  scope :admins, -> { where(role: 'admin') }
  scope :members, -> { where(role: 'member') }

  def owner?
    role == 'owner'
  end

  def admin?
    role == 'admin'
  end

  def member?
    role == 'member'
  end

  def can_manage?
    owner? || admin?
  end
end
