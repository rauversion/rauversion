class Track < ApplicationRecord
  extend FriendlyId
  include Croppable
  include Notifiable

  friendly_id :title, use: :slugged

  belongs_to :user
  has_many :track_comments
  has_many :track_playlists
  has_many :playlists, through: :track_playlists
  has_many :listening_events
  has_many :reposts, dependent: :destroy
  has_many :purchased_items, as: :purchased_item
  has_many :likes, as: :likeable, dependent: :destroy
  has_many :comments, as: :commentable, dependent: :destroy
  has_one :track_peak, dependent: :destroy
  has_many :spotlights, as: :spotlightable, dependent: :destroy
  # has_many :spotlighted_tracks, through: :spotlight_tracks

  belongs_to :label, class_name: "User", optional: true
  attr_accessor :enable_label
  before_save :check_label

  def check_label
   self.label_id = Current.label_user.id if enable_label && Current.label_user 
  end

  has_one_attached :cover
  has_one_attached :audio
  has_one_attached :mp3_audio
  has_one_attached :zip

  validates :cover, presence: false, blob: {content_type: :web_image} # supported options: :web_image, :image, :audio, :video, :text

  validates :audio, presence: false, blob: {content_type: :audio, size_range: 1..(400.megabytes)} # supported options: :web_image, :image, :audio, :video, :text

  acts_as_likeable

  attr_accessor :step, :tab

  scope :published, -> { where(private: false) }
  # scope :private, -> { where.not(:private => true)}
  scope :latests, -> { order("id desc") }

  scope :podcasts, -> {where(podcast: true)}

  # store_attribute :metadata, :ratio, :integer, limit: 1
  # store_attribute :metadata, :login_at, :datetime
  # #store_attribute :metadata, :active, :boolean
  # store_attribute :metadata, :color, :string, default: "red"
  # store_attribute :metadata, :colors, :json, default: ["red", "blue"]
  # store_attribute :metadata, :data, :datetime, default: -> { Time.now }

  # store_attribute :metadata, :peaks, :json, default: []
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

  include AASM

  after_create :reprocess_async

  aasm column: :state do
    state :pending, initial: true
    state :processed

    event :run do
      transitions from: :pending, to: :processed
    end

    event :sleep do
      transitions from: :running, to: :sleeping
    end
  end

  store_accessor :metadata, :crop_data, :json, default: {}
  # store_accessor :settings, :tags, :json, default: []

  # Example method to call cropped_image with specific attributes
  def cropped_image(fallback: :horizontal)
    cropped_image_setup(attached_attribute: :cover, crop_data_attribute: :crop_data, fallback: fallback)
  end

  def peaks
    self.track_peak&.data || []
  end

  def peaks=(peaks)
    if self.track_peak.blank?
      self.build_track_peak(data: peaks) 
    else
      self.track_peak.update(data: peaks) 
    end
  end

  def presicion_for_currency
    0
  end

  def cover_url(size = nil)
    url = case size
    when :medium
      cover.variant(resize_to_limit: [200, 200])

    when :large
      cover.variant(resize_to_limit: [1000, 1000])

    when :small
      cover.variant(resize_to_limit: [50, 50])
    
    when :original
      cover

    else
      cover.variant(resize_to_limit: [200, 200])
    end

    return Rails.application.routes.url_helpers.rails_storage_proxy_url(url) if url.present?

    url || AlbumsHelper.default_image_sqr
  end

  def self.permission_definitions
    [
      {
        name: :direct_download,
        wrapper_class: "sm:col-span-2",
        type: :checkbox,
        checked_hint:
          "This track will be available for direct download in the original format it was uploaded.",
        unchecked_hint:
          "This track will not be available for direct download in the original format it was uploaded."
      },
      {
        name: :display_embed,
        wrapper_class: "sm:col-span-2",
        type: :checkbox,
        checked_hint: "This track’s embedded-player code will be displayed publicly.",
        unchecked_hint: "This track’s embedded-player code will only be displayed to you."
      },
      {
        name: :enable_comments,
        wrapper_class: "sm:col-span-2",
        type: :checkbox,
        checked_hint: "Enable comments",
        unchecked_hint: "Comments disabled."
      },
      {
        name: :display_comments,
        wrapper_class: "sm:col-span-2",
        type: :checkbox,
        checked_hint: "Display comments",
        unchecked_hint: "Don't display public comments."
      },
      {
        name: :display_stats,
        wrapper_class: "sm:col-span-2",
        type: :checkbox,
        checked_hint: "Display public stats",
        unchecked_hint: "Don't display public stats."
      },
      {
        name: :include_in_rss,
        wrapper_class: "sm:col-span-2",
        type: :checkbox,
        checked_hint: "This track will be included in your RSS feed if it is public.",
        unchecked_hint: "This track will not be included in your RSS feed."
      },
      {
        name: :offline_listening,
        wrapper_class: "sm:col-span-2",
        type: :checkbox,
        checked_hint: "This track can be played on devices without an internet connection.",
        unchecked_hint:
          "Playing this track will not be possible on devices without an internet connection."
      },
      {
        name: :enable_app_playblack,
        field_type: :text_fiel,
        wrapper_class: "sm:col-span-2",
        type: :checkbox,
        checked_hint: "This track will be playable outside of Rauversion and its apps.",
        unchecked_hint: "This track will not be playable outside of Rauversion and its apps."
      }
    ]
  end

  def update_peaks
    peaks = process_audio_peaks

    update(peaks: peaks, state: "processed")
  end

  def reprocess_async
    TrackProcessorJob.perform_later(id)
  end

  def reprocess!
    return if audio.blob.blank?
    update_mp3
    update_peaks
  end

  def process_with_mp3
    temp_file = Tempfile.new(["audio", ".mp3"], binmode: true)
    begin
      # Download the blob to the temp file in chunks
      mp3_audio.download do |chunk|
        temp_file.write(chunk)
      end
      temp_file.rewind
      update_peaks
    ensure
      temp_file.close
      temp_file.unlink
    end
  end

  def update_mp3(temp_file = nil)
    created_tempfile = false
    if temp_file.nil?
      temp_file = Tempfile.new(["audio", ".mp3"], binmode: true)
      created_tempfile = true
      begin
        audio.download do |chunk|
          temp_file.write(chunk)
        end
        temp_file.rewind
        # Use the path of the temp file in the Mp3Converter
        mp3_path = Mp3Converter.new(temp_file.path).run
        File.open(mp3_path, "rb") do |mp3_file|
          mp3_audio.attach(io: mp3_file, filename: "converted_audio.mp3", content_type: "audio/mpeg")
        end
        FileUtils.remove_entry mp3_path
      ensure
        temp_file.close
        temp_file.unlink
      end
    else
      mp3_path = Mp3Converter.new(temp_file.path).run
      File.open(mp3_path, "rb") do |mp3_file|
        mp3_audio.attach(io: mp3_file, filename: "converted_audio.mp3", content_type: "audio/mpeg")
      end
      FileUtils.remove_entry mp3_path
      temp_file.close
      temp_file.unlink
    end
  end

  def process_audio_peaks(temp_file = nil)
    # Create a temp file
    if temp_file.nil?
      temp_file = Tempfile.new(["audio", ".mp3"], binmode: true)

      # Download the blob to the temp file in chunks
      audio.download do |chunk|
        temp_file.write(chunk)
      end

      temp_file.rewind
    end

    # Use the path of the temp file in the PeaksGeneratorService
    peaks = PeaksGenerator.new(temp_file.path).run

    # Ensure the temp file is removed after the PeaksGeneratorService has finished
    temp_file.close
    temp_file.unlink

    peaks
  end

  def self.top_tracks(profile_id)
    Track.joins(:listening_events)
      .where(listening_events: {resource_profile_id: profile_id})
      .group(:id)
      .limit(10)
      .select("tracks.*, COUNT(listening_events.id) as count")
      .order("count DESC")
      .includes(:cover_blob, user: :avatar_blob)
  end

  def self.top_listeners(profile_id)
    User.joins(:listening_events)
      .where(listening_events: {resource_profile_id: profile_id})
      .group(:id)
      .limit(10)
      .select("users.*, COUNT(listening_events.id) as count")
      .order("count DESC")
      .includes(:avatar_blob)
  end

  def self.top_countries(profile_id)
    ListeningEvent.where(resource_profile_id: profile_id)
      .group(:country)
      .limit(10)
      .select("country, COUNT(country) as count")
      .order("count DESC")
  end

  def self.series_by_month(profile_id, range: 12)
    ListeningEvent.where(resource_profile_id: profile_id)
      .group_by_month(:created_at, range: range.months.ago.midnight..Time.now).count
      .map { |k, v|
      {count: v, day: k}
    }
  end

  def tags=(list)
    self[:tags] = list.map(&:downcase).reject { |item| item.empty? }
  end

  def iframe_code_string(url)
    <<-HTML
    <iframe width="100%" height="100%" scrolling="no" frameborder="no" allow="autoplay" src="#{url}"></iframe>
    <div 
      style="font-size: 10px; color: #cccccc;line-break: anywhere;word-break: normal;overflow: hidden;white-space: nowrap;text-overflow: ellipsis; font-family: Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif;font-weight: 100;">
      <a href="#{user.username}" title="#{user.username}" 
        target="_blank" 
        style="color: #cccccc; text-decoration: none;">
        #{user.username}
      </a> · 
      <a href="#{url}" title="#{title}" target="_blank" style="color: #cccccc; text-decoration: none;">
        #{title}
      </a>
    </div>
    HTML
  end

  def self.get_tracks_by_tag(tag)
    tag = tag.downcase
    includes(:user).where("? = ANY (tags)", tag)
  end

  def duration
    "xx;xx"
  end

  def podcast_summarizer
    # use downloaded mp3 instead of path_for
    return unless mp3_audio&.attached?

    file_temp = Tempfile.new
    file_temp.binmode
    begin
      # Stream download to tempfile to avoid loading into memory
      mp3_audio.download do |chunk|
        file_temp.write(chunk)
      end
      file_temp.rewind
      file_path = file_temp.path

      summarizer = AudioSummarizer.new(file_path)
      data = summarizer.summarize
      self.update(
        description: data[:summary],
        transcription: data[:transcription]
      )
    ensure
      file_temp.close
      file_temp.unlink
    end
  end

  def self.ransackable_attributes(auth_object = nil)
    ["title", "description", "created_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["user"]
  end

  def some_action
    # Send user-specific notification
    broadcast_notification(user.id, {
      type: 'success',
      title: 'Track Uploaded',
      message: 'Your track was successfully uploaded'
    })

    # Or send global notification
    broadcast_global({
      type: 'info',
      title: 'New Release',
      message: 'Check out the latest release!'
    })
  end
end
