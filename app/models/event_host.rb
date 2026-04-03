class EventHost < ApplicationRecord
  ACCESS_ROLES = %w[host admin admission grant_admission].freeze
  BACKOFFICE_ACCESS_ROLES = %w[admin admission grant_admission].freeze

  belongs_to :event
  belongs_to :user, optional: true

  has_one_attached :avatar

  attr_accessor :email

  before_validation :normalize_access_role

  validates :access_role, inclusion: { in: ACCESS_ROLES }

  # before_save :invite_user

  scope :with_backoffice_access, -> { where(access_role: BACKOFFICE_ACCESS_ROLES) }
  scope :with_reports_access, -> { where(access_role: "admin") }
  scope :with_attendees_access, -> { where(access_role: BACKOFFICE_ACCESS_ROLES) }
  scope :with_admission_access, -> { where(access_role: BACKOFFICE_ACCESS_ROLES) }

  def invite_user
    if email.present?
      # Find the existing user or create and invite a new one
      invited_user = User.find_by(email: email) || User.invite!(email: email)

      # Associate the invited user with the event host
      self.user = invited_user
    end
  end

  def avatar_url(size = :medium)
    return nil unless avatar.attached?

    url = case size
    when :medium
      avatar.variant(resize_to_fill: [200, 200])
    when :large
      avatar.variant(resize_to_fill: [500, 500])
    when :small
      avatar.variant(resize_to_fill: [50, 50])
    else
      avatar.variant(resize_to_fill: [200, 200])
    end

    Rails.application.routes.url_helpers.rails_storage_proxy_url(url) if url.present?
  end

  def admin_access?
    access_role == "admin"
  end

  def admission_access?
    %w[admin admission grant_admission].include?(access_role)
  end

  def can_access_backoffice?
    BACKOFFICE_ACCESS_ROLES.include?(access_role)
  end

  def can_access_reports?
    admin_access?
  end

  def can_access_attendees?
    admission_access?
  end

  def can_access_admission?
    admission_access?
  end

  def can_manage_attendee_invitations?
    %w[admin grant_admission].include?(access_role)
  end

  def can_export_attendees?
    admin_access?
  end

  def can_refund_attendees?
    admin_access?
  end

  private

  def normalize_access_role
    self.access_role = access_role.presence || (event_manager? ? "admin" : "host")
    self.event_manager = (access_role == "admin")
  end
end
