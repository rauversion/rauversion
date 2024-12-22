class LinkService < ApplicationRecord
  validates :name, presence: true
  validates :url_pattern, presence: true
  validates :position, presence: true, numericality: { only_integer: true }
  
  default_scope { order(position: :asc) }
  scope :active, -> { where(active: true) }
  
  before_validation :set_position, on: :create
  
  SERVICES = {
    instagram: {
      name: 'Instagram',
      icon: 'fa-brands fa-instagram',
      url_pattern: 'https://instagram.com/%{username}'
    },
    youtube: {
      name: 'YouTube',
      icon: 'fa-brands fa-youtube',
      url_pattern: 'https://youtube.com/@%{username}'
    },
    tiktok: {
      name: 'TikTok',
      icon: 'fa-brands fa-tiktok',
      url_pattern: 'https://tiktok.com/@%{username}'
    },
    whatsapp: {
      name: 'WhatsApp',
      icon: 'fa-brands fa-whatsapp',
      url_pattern: 'https://wa.me/%{phone}'
    },
    website: {
      name: 'Website',
      icon: 'fa-solid fa-globe',
      url_pattern: '%{url}'
    },
    amazon: {
      name: 'Amazon',
      icon: 'fa-brands fa-amazon',
      url_pattern: 'https://amazon.com/shop/%{username}'
    },
    spotify: {
      name: 'Spotify',
      icon: 'fa-brands fa-spotify',
      url_pattern: 'https://open.spotify.com/artist/%{id}'
    },
    facebook: {
      name: 'Facebook',
      icon: 'fa-brands fa-facebook',
      url_pattern: 'https://facebook.com/%{username}'
    },
    x: {
      name: 'X',
      icon: 'fa-brands fa-x-twitter',
      url_pattern: 'https://x.com/%{username}'
    },
    soundcloud: {
      name: 'SoundCloud',
      icon: 'fa-brands fa-soundcloud',
      url_pattern: 'https://soundcloud.com/%{username}'
    },
    snapchat: {
      name: 'Snapchat',
      icon: 'fa-brands fa-snapchat',
      url_pattern: 'https://snapchat.com/add/%{username}'
    },
    pinterest: {
      name: 'Pinterest',
      icon: 'fa-brands fa-pinterest',
      url_pattern: 'https://pinterest.com/%{username}'
    },
    threads: {
      name: 'Threads',
      icon: 'fa-brands fa-threads',
      url_pattern: 'https://threads.net/@%{username}'
    }
  }

  def self.seed_services
    SERVICES.each_with_index do |(key, service), index|
      create!(
        name: service[:name],
        icon: service[:icon],
        url_pattern: service[:url_pattern],
        position: index + 1
      )
    end
  end

  private

  def set_position
    self.position ||= self.class.maximum(:position).to_i + 1
  end
end
