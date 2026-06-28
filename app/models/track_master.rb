class TrackMaster < ApplicationRecord
  TARGET_PROFILE_KEYS = %w[
    streaming_clean
    club_loud
    demo_balanced
    vinyl_premaster
  ].freeze

  belongs_to :track
  has_one :user, through: :track
  has_one_attached :audio

  validates :target_profile, inclusion: { in: TARGET_PROFILE_KEYS }
  validates :state, presence: true

  before_validation :set_defaults

  scope :latest_first, -> { order(created_at: :desc) }

  def pending?
    state == "pending"
  end

  def running?
    state == "running"
  end

  def completed?
    state == "completed"
  end

  def failed?
    state == "failed"
  end

  def ready?
    completed? && audio.attached?
  end

  def mark_running!
    update!(
      state: "running",
      started_at: Time.current,
      failed_at: nil,
      error_message: nil
    )
  end

  def mark_completed!(attributes = {})
    update!(
      attributes.merge(
        state: "completed",
        completed_at: Time.current,
        failed_at: nil,
        error_message: nil
      )
    )
  end

  def mark_failed!(message)
    update!(
      state: "failed",
      failed_at: Time.current,
      error_message: message.to_s.truncate(1000)
    )
  end

  def retry!(feedback: nil, reference_notes: nil)
    audio.purge if audio.attached?

    update!(
      state: "pending",
      feedback: feedback.presence || self.feedback,
      reference_notes: reference_notes.presence || self.reference_notes,
      recipe: {},
      analysis_before: {},
      analysis_after: {},
      started_at: nil,
      completed_at: nil,
      failed_at: nil,
      error_message: nil
    )
  end

  private

  def set_defaults
    self.target_profile = "demo_balanced" if target_profile.blank?
    self.state = "pending" if state.blank?
  end
end
