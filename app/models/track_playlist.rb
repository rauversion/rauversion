class TrackPlaylist < ApplicationRecord
  belongs_to :playlist
  belongs_to :track

  validate :track_and_playlist_share_tenant

  acts_as_list scope: [:playlist_id]

  scope :by_position, -> { order("position asc") }

  private

  def track_and_playlist_share_tenant
    return if track.blank? || playlist.blank? || track.tenant_id == playlist.tenant_id

    errors.add(:track, "must belong to the same tenant as the playlist")
  end

end
