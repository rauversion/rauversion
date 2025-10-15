class Venue < ApplicationRecord
  has_one_attached :cover_image

  extend FriendlyId
  friendly_id :name, use: :slugged

  has_many :venue_reviews, dependent: :destroy

  geocoded_by :address, latitude: :lat, longitude: :lng
  after_validation :geocode, if: :should_geocode?

  validates :name, presence: true
  validates :rating, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 5 }
  validates :capacity, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  def should_geocode?
    address.present? && (will_save_change_to_address? || lat.blank? || lng.blank?)
  end

  def recalc_reviews!
    stats = venue_reviews.select("COUNT(*) as cnt, AVG(overall_rating) as avg").take
    count = stats&.cnt.to_i
    avg = stats&.avg.to_f
    update_columns(review_count: count, rating: (count.positive? ? avg.round(2) : 0.0))
  end

  def should_generate_new_friendly_id?
    slug.blank? || will_save_change_to_name?
  end
end
