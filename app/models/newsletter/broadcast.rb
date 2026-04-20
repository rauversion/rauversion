class Newsletter::Broadcast < ApplicationRecord
  STATUSES = %w[draft queued sending completed completed_with_errors failed].freeze

  belongs_to :user
  belongs_to :audience, class_name: "Newsletter::Audience", optional: true
  belongs_to :email_template, optional: true
  has_many :recipients, class_name: "Newsletter::BroadcastRecipient", dependent: :destroy, inverse_of: :broadcast

  validates :name, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }

  before_validation :normalize_status

  def active_delivery?
    %w[queued sending].include?(status)
  end

  def finished?
    %w[completed completed_with_errors failed].include?(status)
  end

  def pending_recipients_count
    [total_recipients - sent_recipients - failed_recipients, 0].max
  end

  private

  def normalize_status
    self.status = status.presence || "draft"
  end
end
