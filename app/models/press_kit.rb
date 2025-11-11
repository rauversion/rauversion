class PressKit < ApplicationRecord
  belongs_to :user
  has_many :photos, as: :photoable, dependent: :destroy
  
  validates :data, presence: true
  
  # Default data structure
  def self.default_data
    {
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
      playlists: [],
      externalMusicLinks: []
    }
  end
  
  # Initialize with default data if empty
  after_initialize do
    self.data ||= self.class.default_data
  end
end
