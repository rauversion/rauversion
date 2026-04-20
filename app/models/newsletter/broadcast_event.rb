class Newsletter::BroadcastEvent < ApplicationRecord
  EVENT_TYPES = %w[open click].freeze

  belongs_to :broadcast, class_name: "Newsletter::Broadcast", inverse_of: :events
  belongs_to :recipient, class_name: "Newsletter::BroadcastRecipient", inverse_of: :events

  validates :event_type, presence: true, inclusion: { in: EVENT_TYPES }
  validates :occurred_at, presence: true
  validates :tracked_url, presence: true, if: :click?

  before_validation :normalize_event_type
  before_validation :sync_broadcast
  before_validation :set_occurred_at

  scope :opens, -> { where(event_type: "open") }
  scope :clicks, -> { where(event_type: "click") }

  def click?
    event_type == "click"
  end

  private

  def normalize_event_type
    self.event_type = event_type.to_s
  end

  def sync_broadcast
    self.broadcast ||= recipient&.broadcast
  end

  def set_occurred_at
    self.occurred_at ||= Time.current
  end
end
