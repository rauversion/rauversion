class PressKit < ApplicationRecord
  belongs_to :user
  has_many :photos, as: :photoable, dependent: :destroy

  validates :data, presence: true

  # Keep a stable upload-order fallback for legacy kits and unlisted photos.
  # Only this kit's own photos can participate in the requested order.
  def ordered_photos(photo_ids: data["photo_ids"])
    remaining = photos.with_attached_image.order(:created_at, :id).index_by { |photo| photo.id.to_s }
    requested_ids = photo_ids.is_a?(Array) ? photo_ids : []
    requested_ids.filter_map { |id| remaining.delete(id.to_s) } + remaining.values
  end

  # Default data structure
  def self.default_data
    {
      published: false,
      template: "classic",
      theme: "dark",
      artistName: "",
      tagline: "",
      location: "",
      listeners: "",
      bio: {
        intro: "",
        career: "",
        sound: ""
      },
      achievements: [],
      genres: [],
      socialLinks: [],
      contacts: [],
      tourDates: [],
      technicalRider: "",
      videos: [],
      photo_ids: [],
      playlist_ids: [],
      track_ids: [],
      externalMusicLinks: [
        # Example: { platform: 'spotify', url: 'https://...', title: 'Album Name' }
      ]
    }
  end


  # Get user's playlists for display
  def user_playlists
    user.playlists.where(private: false).order(created_at: :desc)
  end

  # Initialize with default data and settings if empty
  after_initialize do
    self.data ||= self.class.default_data
  end

  # Convenience helper to check public visibility
  def published?
    data && data["published"] == true
  end
end
