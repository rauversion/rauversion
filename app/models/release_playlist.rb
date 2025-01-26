class ReleasePlaylist < ApplicationRecord
  belongs_to :release
  belongs_to :playlist

  validates :release_id, uniqueness: { scope: :playlist_id }
  acts_as_list scope: :release
end
