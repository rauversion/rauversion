module PlaylistGen
  class PlaylistTrack < ApplicationRecord
    belongs_to :playlist
    belongs_to :track

    validates :position, presence: true, numericality: { only_integer: true, greater_than: 0 }
    validates :track_id, uniqueness: { scope: :playlist_id }

    scope :ordered, -> { order(position: :asc) }

    def duration_human
      return nil unless track&.duration_seconds

      minutes = track.duration_seconds / 60
      seconds = track.duration_seconds % 60
      "#{minutes}:#{seconds.to_s.rjust(2, '0')}"
    end
  end
end
