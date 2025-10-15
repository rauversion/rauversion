class VenueReview < ApplicationRecord
  belongs_to :venue
  belongs_to :user

  ROLES = %w[attendee musician].freeze

  validates :reviewer_role, presence: true, inclusion: { in: ROLES }
  validates :overall_rating, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 5 }
  validate :validate_aspects_scores

  # Incremental stats: capturamos snapshot antes de update/destroy
  before_update :store_snapshot_before_update
  before_destroy :store_snapshot_before_destroy

  after_create_commit { VenueRatings::Accumulator.apply_create(self) }
  after_update_commit do
    before = @snapshot_before_update || fallback_snapshot_before
    VenueRatings::Accumulator.apply_update(self, before: before)
  end
  after_destroy_commit do
    before = @snapshot_before_destroy || fallback_snapshot_before
    VenueRatings::Accumulator.apply_destroy(before: before)
  end

  # Mantener agregados globales en Venue
  after_commit :recalc_venue_aggregates, on: %i[create update destroy]

  private

  def validate_aspects_scores
    return if aspects.blank?

    aspects.each do |key, value|
      next if value.nil?
      numeric = value.is_a?(Numeric) || value.to_s.match?(/\A-?\d+(\.\d+)?\z/)
      unless numeric
        errors.add(:aspects, "#{key} must be a number")
        next
      end
      v = value.to_f
      unless v >= 0 && v <= 5
        errors.add(:aspects, "#{key} must be between 0 and 5")
      end
    end
  end

  def recalc_venue_aggregates
    venue.recalc_reviews!
  end

  # Snapshots para el acumulador

  def store_snapshot_before_update
    @snapshot_before_update = {
      venue_id: (respond_to?(:venue_id_before_last_save) ? venue_id_before_last_save : venue_id),
      reviewer_role: (respond_to?(:reviewer_role_before_last_save) ? reviewer_role_before_last_save : reviewer_role),
      bucket_on: ((respond_to?(:created_at_before_last_save) ? created_at_before_last_save : created_at) || Time.current).to_date,
      overall_rating: (respond_to?(:overall_rating_before_last_save) ? (overall_rating_before_last_save || overall_rating) : overall_rating).to_f,
      aspects: (respond_to?(:aspects_before_last_save) ? (aspects_before_last_save || aspects) : aspects)
    }
  end

  def store_snapshot_before_destroy
    @snapshot_before_destroy = {
      venue_id: venue_id,
      reviewer_role: reviewer_role,
      bucket_on: (created_at || Time.current).to_date,
      overall_rating: overall_rating.to_f,
      aspects: aspects
    }
  end

  def fallback_snapshot_before
    {
      venue_id: venue_id,
      reviewer_role: reviewer_role,
      bucket_on: (created_at || Time.current).to_date,
      overall_rating: overall_rating.to_f,
      aspects: aspects
    }
  end
end
