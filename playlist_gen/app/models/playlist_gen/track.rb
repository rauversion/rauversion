module PlaylistGen
  class Track < ApplicationRecord
    has_many :playlist_tracks, dependent: :destroy
    has_many :playlists, through: :playlist_tracks

    validates :title, presence: true
    validates :external_id, uniqueness: { scope: :source }, allow_nil: true
    validates :bpm, numericality: { greater_than: 0 }, allow_nil: true
    validates :energy, inclusion: { in: 1..10 }, allow_nil: true
    validates :duration_seconds, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

    scope :by_bpm_range, ->(min, max) { where(bpm: min..max) }
    scope :by_genres, ->(genres) { where("LOWER(genre) IN (?)", genres.map(&:downcase)) }
    scope :by_energy_range, ->(min, max) { where(energy: min..max) }
    scope :by_source, ->(source) { where(source: source) }
  end
end
