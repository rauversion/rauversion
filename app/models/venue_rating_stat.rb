class VenueRatingStat < ApplicationRecord
  belongs_to :venue

  validates :bucket_on, presence: true
  validates :reviewer_role, presence: true
  validates :metric, presence: true
  validates :sum, numericality: true
  validates :count, numericality: { only_integer: true }

  scope :for_venue, ->(venue_id) { where(venue_id: venue_id) }
  scope :overall, -> { where(metric: "overall") }
end
