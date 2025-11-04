class PressKit < ApplicationRecord
  belongs_to :user
  
  has_many_attached :photos
  has_many_attached :documents
  
  # Validations
  validates :user_id, uniqueness: true
  
  # Store attributes for settings
  store_attribute :settings, :video_urls, :json, default: []
  store_attribute :settings, :featured_track_ids, :json, default: []
  store_attribute :settings, :featured_playlist_ids, :json, default: []
  
  # Scopes
  scope :published, -> { where(published: true) }
  
  def self.ransackable_attributes(auth_object = nil)
    ["bio", "booking_info", "created_at", "id", "press_release", "published", "settings", "stage_plot", "technical_rider", "updated_at", "user_id"]
  end
  
  def self.ransackable_associations(auth_object = nil)
    ["user"]
  end
end
