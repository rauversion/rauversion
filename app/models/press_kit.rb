class PressKit < ApplicationRecord
  belongs_to :user
  has_many :photos, as: :photoable, dependent: :destroy

  validates :data, presence: true

  # Default data structure
  def self.default_data
    {
      published: false,
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
