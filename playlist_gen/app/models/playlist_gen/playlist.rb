module PlaylistGen
  class Playlist < ApplicationRecord
    has_many :playlist_tracks, -> { order(position: :asc) }, dependent: :destroy
    has_many :tracks, through: :playlist_tracks

    ENERGY_CURVES = %w[linear_up constant waves].freeze
    STATUSES = %w[generated draft failed].freeze

    validates :name, presence: true
    validates :status, inclusion: { in: STATUSES }
    validates :energy_curve, inclusion: { in: ENERGY_CURVES }, allow_nil: true

    scope :generated, -> { where(status: "generated") }
    scope :recent, -> { order(generated_at: :desc) }

    def duration_human
      return nil unless duration_seconds

      hours = duration_seconds / 3600
      minutes = (duration_seconds % 3600) / 60

      if hours > 0
        "#{hours}h #{minutes}m"
      else
        "#{minutes}m"
      end
    end

    def ordered_tracks
      playlist_tracks.includes(:track).map(&:track)
    end
  end
end
