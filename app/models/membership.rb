class Membership < ApplicationRecord
  ROLES = %w[member artist editor admin owner].freeze
  CONTENT_ROLES = %w[artist editor admin owner].freeze

  belongs_to :tenant
  belongs_to :user

  enum :role, ROLES.index_with(&:itself)

  validates :role, inclusion: { in: ROLES }
  validates :user_id, uniqueness: { scope: :tenant_id }

  scope :with_content_access, -> { where(role: CONTENT_ROLES) }

  def can_manage_content?
    role.in?(CONTENT_ROLES)
  end

  def self.role_for_user(user)
    return "admin" if user.role == "admin"
    return "artist" if user.role == "artist"
    return "editor" if user.editor?

    "member"
  end
end
