class Playlist < ApplicationRecord


  class Types
    def self.plain
      [
        "playlist",
        "album",
        "ep",
        "single",
        "compilation"
      ]
    end
  end

  include Croppable

  extend FriendlyId
  friendly_id :title, use: :slugged

  belongs_to :user
  belongs_to :label, class_name: "User", optional: true

  has_many :track_playlists
  has_many :tracks, through: :track_playlists
  has_many :listening_events
  has_many :comments, as: :commentable
  has_many :likes, as: :likeable
  has_many :products
  has_many :releases

  has_one_attached :cover
  has_one_attached :zip

  acts_as_likeable

  accepts_nested_attributes_for :track_playlists, allow_destroy: true

  belongs_to :label, class_name: "User", optional: true
  attr_accessor :enable_label
  before_save :check_label

  def check_label
   self.label_id = Current.label_user.id if enable_label && Current.label_user 
  end

  scope :latests, -> { order("id desc") }
  scope :published, -> { where(private: [false, nil]) }
  scope :albums, -> { where(playlist_type: "album") }
  store_accessor :metadata, :buy_link, :string
  store_accessor :metadata, :buy_link_title, :string
  store_accessor :metadata, :buy, :boolean, default: false
  store_accessor :metadata, :record_label, :string

  store_accessor :metadata, :attribution, :boolean
  store_accessor :metadata, :noncommercial, :boolean
  store_accessor :metadata, :non_derivative_works, :boolean
  store_accessor :metadata, :share_alike, :boolean
  store_accessor :metadata, :copies, :string
  store_accessor :metadata, :copyright, :string
  store_accessor :metadata, :price, :decimal
  store_accessor :metadata, :name_your_price, :boolean


  # trck copied
  store_attribute :metadata, :contains_music, :boolean
  store_attribute :metadata, :artist, :string
  store_attribute :metadata, :publisher, :string
  store_attribute :metadata, :isrc, :string
  store_attribute :metadata, :composer, :string
  store_attribute :metadata, :release_title, :string
  store_attribute :metadata, :buy_link, :string
  store_attribute :metadata, :buy_link_title, :string
  store_attribute :metadata, :buy, :boolean
  store_attribute :metadata, :album_title, :string
  store_attribute :metadata, :record_label, :string
  store_attribute :metadata, :release_date, :date
  store_attribute :metadata, :barcode, :string
  store_attribute :metadata, :iswc, :string
  store_attribute :metadata, :p_line, :string
  store_attribute :metadata, :contains_explicit_content, :boolean
  store_attribute :metadata, :copyright, :string
  store_attribute :metadata, :genre, :string
  store_attribute :metadata, :direct_download, :boolean
  store_attribute :metadata, :display_embed, :boolean
  store_attribute :metadata, :enable_comments, :boolean, default: true
  store_attribute :metadata, :display_comments, :boolean, default: true
  store_attribute :metadata, :display_stats, :boolean
  store_attribute :metadata, :include_in_rss, :boolean
  store_attribute :metadata, :offline_listening, :boolean
  store_attribute :metadata, :enable_app_playblack, :boolean
  store_attribute :metadata, :attribution, :boolean
  store_attribute :metadata, :noncommercial, :boolean
  store_attribute :metadata, :non_derivative_works, :boolean
  store_attribute :metadata, :share_alike, :boolean
  store_attribute :metadata, :copies, :string
  store_attribute :metadata, :price, :decimal
  store_attribute :metadata, :name_your_price, :boolean
  store_attribute :metadata, :transcription, :string
  store_accessor :metadata, :crop_data, :json, default: {}


  def self.ransackable_attributes(auth_object = nil)
    ["created_at", "custom_genre", "description", "editor_choice_position", "genre", "id", "id_value", "label_id", "likes_count", "metadata", "playlist_type", "private", "release_date", "slug", "tags", "title", "updated_at", "user_id"]
  end
  
  def name_your_price?
    name_your_price.present?
  end

  # Example method to call cropped_image with specific attributes
  def cropped_image(fallback: :large)
    cropped_image_setup(attached_attribute: :cover, crop_data_attribute: :crop_data, fallback: fallback)
  end

  def cover_url(size = nil)
    url = case size
    when :medium
      cover.variant(resize_to_limit: [200, 200])&.processed&.url

    when :large
      cover.variant(resize_to_limit: [500, 500])&.processed&.url

    when :small
      cover.variant(resize_to_limit: [50, 50])&.processed&.url
    
    when :original
      cover.url

    else
      cover.variant(resize_to_limit: [200, 200])&.processed&.url
    end

    url || "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png"
  end

  def album?
    return false if playlist_type.nil?
    playlist_type != "playlist"
  end

  def self.list_playlists_by_user_with_track(track_id, user_id)
    #Playlist.select("playlists.*, COUNT(track_playlists.track_id) as track_count")
    #  .left_outer_joins(:track_playlists)
    #  .where(user_id: user_id, track_playlists: {track_id: [nil, track_id]})
    #  .group("playlists.id")


    Playlist
      .select("playlists.*, SUM(CASE WHEN track_playlists.track_id = #{track_id} THEN 1 ELSE 0 END) as track_count")
      .left_outer_joins(:track_playlists)
      .where(user_id: user_id)
      .group("playlists.id")
  end

  def ordered_tracks
   
    tracks.joins(:track_playlists).select('tracks.*, track_playlists.position').distinct.order('track_playlists.position')

  end

  def iframe_code_string(url)
    <<-HTML
      <iframe width="100%" height="100%" scrolling="no" frameborder="no" allow="autoplay" src="#{url}">
      </iframe>
      <div style="font-size: 10px; color: #cccccc;line-break: anywhere;word-break: normal;overflow: hidden;white-space: nowrap;text-overflow: ellipsis; font-family: Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif;font-weight: 100;">
        <a href="#{user.username}" title="#{user.username}" target="_blank" style="color: #cccccc; text-decoration: none;">#{user.username}</a> · 
        <a href="#{url}" title="#{title}" target="_blank" style="color: #cccccc; text-decoration: none;">#{title}</a>
      </div>
    HTML
  end
end
