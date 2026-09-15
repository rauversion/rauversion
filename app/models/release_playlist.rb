class ReleasePlaylist < ApplicationRecord
  belongs_to :release
  belongs_to :playlist

  validate :playlist_belongs_to_release_tenant

  private

  def playlist_belongs_to_release_tenant
    return if release.blank? || playlist.blank? || release.tenant_id == playlist.tenant_id

    errors.add(:playlist, "must belong to the same tenant as the release")
  end

  validates :release_id, uniqueness: { scope: :playlist_id }
  acts_as_list scope: :release
end
