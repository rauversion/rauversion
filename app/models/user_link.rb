class UserLink < ApplicationRecord
  belongs_to :user
  
  validates :title, presence: true
  validates :position, presence: true, numericality: { only_integer: true }
  
  default_scope { order(position: :asc) }
  
  before_validation :set_position, on: :create
  before_validation :set_default_title, if: :title_blank?

  def self.available_types
    {
      instagram: 'Instagram',
      youtube: 'YouTube',
      tiktok: 'TikTok',
      whatsapp: 'WhatsApp',
      website: 'Website',
      amazon: 'Amazon',
      spotify: 'Spotify',
      facebook: 'Facebook',
      x: 'X',
      soundcloud: 'SoundCloud',
      snapchat: 'Snapchat',
      pinterest: 'Pinterest',
      threads: 'Threads'
    }
  end

  def icon_class
    'fa-solid fa-link'
  end

  def url
    custom_url.presence || generate_url
  end

  protected

  def generate_url
    nil
  end

  private

  def set_position
    self.position ||= user.user_links.maximum(:position).to_i + 1
  end

  def set_default_title
    self.title = self.class.name.demodulize.titleize
  end

  def title_blank?
    title.blank?
  end
end
