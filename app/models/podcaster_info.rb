class PodcasterInfo < ApplicationRecord
  belongs_to :user
  has_one_attached :avatar
  has_many :podcaster_hosts, dependent: :destroy
  has_many :hosts, through: :podcaster_hosts, source: :user

  accepts_nested_attributes_for :podcaster_hosts, allow_destroy: true, reject_if: :all_blank

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

  def avatar_url(size = :medium)
    url = case size
    when :medium
      avatar.variant(resize_to_fill: [200, 200]) # &.processed&.url

    when :large
      avatar.variant(resize_to_fill: [500, 500]) # &.processed&.url

    when :small
      avatar.variant(resize_to_fill: [50, 50]) # &.processed&.url

    else
      avatar.variant(resize_to_fill: [200, 200]) # &.processed&.url
    end

    return Rails.application.routes.url_helpers.rails_storage_proxy_url(url) if url.present?

    "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png"
  end
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

  def podcaster_hosts_ids
    podcaster_hosts.pluck(:user_id)
  end

  def podcaster_hosts_ids=(ids)
    ids = Array(ids).reject(&:blank?).map(&:to_i)
    
    # Remove hosts that are no longer in the list
    podcaster_hosts.where.not(user_id: ids).destroy_all
    
    # Add new hosts
    ids.each do |user_id|
      podcaster_hosts.find_or_create_by(user_id: user_id) do |ph|
        ph.role = 'host'
      end
    end
  end
end
