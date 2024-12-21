class PodcasterInfo < ApplicationRecord
  belongs_to :user
  has_one_attached :avatar


  store_accessor :data, :spotify_url
  store_accessor :data, :apple_podcasts_url
  store_accessor :data, :google_podcasts_url
  store_accessor :data, :stitcher_url
  store_accessor :data, :overcast_url
  store_accessor :data, :pocket_casts_url

  validates :title, presence: true
  validates :about, presence: true
  validates :description, presence: true
  # You can add validations for these fields if needed
  validates :spotify_url, url: true, allow_blank: true
  validates :apple_podcasts_url, url: true, allow_blank: true
  validates :google_podcasts_url, url: true, allow_blank: true
  validates :stitcher_url, url: true, allow_blank: true
  validates :overcast_url, url: true, allow_blank: true
  validates :pocket_casts_url, url: true, allow_blank: true

  # You can add custom methods to work with these fields
  def has_podcast_links?
    spotify_url.present? || apple_podcasts_url.present? || google_podcasts_url.present? ||
      stitcher_url.present? || overcast_url.present? || pocket_casts_url.present?
  end

  def podcast_links
    {
      spotify: spotify_url,
      apple_podcasts: apple_podcasts_url,
      google_podcasts: google_podcasts_url,
      stitcher: stitcher_url,
      overcast: overcast_url,
      pocket_casts: pocket_casts_url
    }.compact
  end
end
