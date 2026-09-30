require "digest"

module TrackPreview
  extend ActiveSupport::Concern

  class StaleProcessing < StandardError; end

  included do
    attr_accessor :confirm_full_length
    store_attribute :metadata, :preview_enabled, :boolean, default: false
    store_attribute :metadata, :preview_start_seconds, :float, default: 0
    store_attribute :metadata, :preview_duration_seconds, :float, default: 30

    validates :preview_start_seconds, numericality: { greater_than_or_equal_to: 0 }, if: :preview_enabled?
    validates :preview_duration_seconds, numericality: { greater_than: 0 }, if: :preview_enabled?
    validate :validate_preview_window
    validate :confirm_full_length_reprocessing

    before_save :prepare_playback_reprocessing
    after_save :invalidate_outdated_playback
    after_commit :enqueue_playback_reprocessing
  end

  def preview_enabled?
    preview_enabled == true
  end

  def original_duration
    [audio, video].each do |attachment|
      next unless attachment.attached?

      value = Float(attachment.metadata["duration"], exception: false)
      return value if value&.finite? && value.positive?
    end
    nil
  end

  # Includes the source so a job for an older upload cannot publish its result.
  def playback_signature
    source = video.attached? ? video : audio
    Digest::SHA256.hexdigest([
      source.blob&.id,
      preview_enabled?,
      (preview_start_seconds if preview_enabled?),
      (preview_duration_seconds if preview_enabled?)
    ].to_json)
  end

  def current_playback?
    return false unless mp3_audio.attached?

    signature = mp3_audio.metadata["playback_signature"]
    return !preview_enabled? if signature.blank? # Existing full-length MP3s.

    signature == playback_signature
  end

  private

  def confirm_full_length_reprocessing
    previously_enabled = ActiveModel::Type::Boolean.new.cast((metadata_in_database || {})["preview_enabled"])
    return unless persisted? && previously_enabled && !preview_enabled?
    return if ActiveModel::Type::Boolean.new.cast(confirm_full_length)

    errors.add(:preview_enabled, :confirmation_required)
  end

  def validate_preview_window
    return unless preview_enabled?

    if video.attached?
      errors.add(:preview_enabled, :audio_only)
    end

    start = preview_start_seconds
    length = preview_duration_seconds
    return unless start.is_a?(Numeric) && length.is_a?(Numeric)

    unless start.finite? && length.finite?
      errors.add(:preview_duration_seconds, :invalid)
      return
    end
    if original_duration.present? && start + length > original_duration.to_f
      errors.add(:preview_duration_seconds, :outside_audio)
    end
  end

  def prepare_playback_reprocessing
    return if @writing_generated_media

    previous = metadata_in_database || {}
    previous_enabled = ActiveModel::Type::Boolean.new.cast(previous.fetch("preview_enabled", false)) == true
    settings_changed = previous_enabled != preview_enabled? || (preview_enabled? && (
      previous.fetch("preview_start_seconds", 0).to_f != preview_start_seconds ||
      previous.fetch("preview_duration_seconds", 30).to_f != preview_duration_seconds
    ))
    source_changed = attachment_changes.key?("video") || attachment_changes.key?("audio")
    @invalidate_playback = settings_changed || source_changed
    return unless @invalidate_playback

    self.state = "pending"
    self.processing_step = "queued"
    self.processing_progress = 0
  end

  def invalidate_outdated_playback
    return unless @invalidate_playback

    @invalidate_playback = false
    # Detach in the same transaction as the setting change; remove the stored
    # copy through Active Storage's purge job, including its old signed URL.
    mp3_audio.purge_later if mp3_audio.attached?
    track_peak&.destroy!
    association(:track_peak).reset
    @enqueue_playback = true
  end

  def enqueue_playback_reprocessing
    return unless @enqueue_playback

    @enqueue_playback = false
    TrackProcessorJob.perform_later(id) if audio.attached? || video.attached?
  end

  def with_current_processing(expected_signature: @processing_signature || playback_signature)
    with_lock do
      raise StaleProcessing unless playback_signature == expected_signature

      yield
    end
  end
end
