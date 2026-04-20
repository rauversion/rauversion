class Newsletter::BroadcastRecipient < ApplicationRecord
  STATUSES = %w[pending sent failed].freeze

  belongs_to :broadcast, class_name: "Newsletter::Broadcast", inverse_of: :recipients
  has_many :events, class_name: "Newsletter::BroadcastEvent", dependent: :destroy, inverse_of: :recipient

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :email, uniqueness: { scope: :broadcast_id }

  before_validation :normalize_email
  before_validation :normalize_status

  def resolved_name
    name.presence || display_name.presence || [first_name, last_name].compact.join(" ").strip.presence
  end

  private

  def normalize_email
    self.email = email.to_s.downcase.strip.presence
  end

  def normalize_status
    self.status = status.presence || "pending"
  end
end
