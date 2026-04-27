# app/models/track_bulk_creator.rb
# require 'active_model'

class TrackBulkCreator
  include ActiveModel::Model

  attr_accessor :tracks_attributes, 
  :step,
  :user, 
  :make_playlist, 
  :playlist_title,
  :playlist_type,
  :playlist_private,
  :playlist,
  :private

  validate :validate_tracks
  validate :validate_playlist, if: :make_playlist?

  # Initialize the tracks_attributes with an empty array
  def initialize(attributes = {})
    normalized_attributes = attributes.respond_to?(:to_h) ? attributes.to_h.with_indifferent_access : {}
    super(attributes)
    self.private = boolean_type.cast(normalized_attributes[:private])
    self.make_playlist = boolean_type.cast(normalized_attributes[:make_playlist])
    self.playlist_type = normalized_attributes[:playlist_type].presence || "playlist"
    self.playlist_private = boolean_type.cast(normalized_attributes[:playlist_private])
    self.tracks_attributes ||= []
  end

  def tracks_attributes_objects=(attributes)
    # array = attributes.keys.map { |o| attributes[o] }
    self.tracks_attributes = attributes # .map { |o| Track.new(o) }
    # array.map{|o| ScheduleRecord.new(o) }
  end

  def save
    if !valid?
      return false
    end

    ActiveRecord::Base.transaction do
      tracks.each(&:save!)
      create_playlist! if make_playlist?
    end

    true
  rescue => e
    errors.add(:base, e.message)
    false
  end

  def tracks
    @tracks ||= tracks_attributes.map do |attributes|
      track_attributes = attributes.to_h.symbolize_keys
      blob = ActiveStorage::Blob.find_signed(track_attributes[:audio])
      t = Track.new(track_attributes.except(:audio))
      t.title = File.basename(blob.filename.to_s, File.extname(blob.filename.to_s)) unless t.title.present?
      t.user = user
      t.private = ActiveRecord::Type::Boolean.new.cast(track_attributes[:private])
      attach_source_blob(track: t, blob: blob)
      t
    end
  end

  def make_playlist?
    boolean_type.cast(make_playlist)
  end

  def playlist_private?
    boolean_type.cast(playlist_private)
  end

  private

  def boolean_type
    @boolean_type ||= ActiveModel::Type::Boolean.new
  end

  def create_playlist!
    self.playlist = user.playlists.create!(
      title: playlist_title.to_s.strip,
      private: playlist_private?,
      playlist_type: playlist_type_value
    )

    tracks.each.with_index(1) do |track, position|
      playlist.track_playlists.create!(track: track, position: position)
    end
  end

  def validate_playlist
    errors.add(:playlist_title, "can't be blank") if playlist_title.to_s.strip.blank?
    errors.add(:playlist_type, "is not included in the list") unless Playlist::Types.plain.include?(playlist_type_value)
    errors.add(:base, "Playlist creation requires at least two tracks") if tracks.size < 2
  end

  def playlist_type_value
    playlist_type.to_s.presence || "playlist"
  end

  def validate_tracks
    tracks.each do |track|
      next if track.valid?
      track.errors.full_messages.each do |message|
        errors.add(:base, "#{track.title}: #{message}")
      end
    end
  end

  def attach_source_blob(track:, blob:)
    attachment_name = blob.content_type.to_s.start_with?("video/") ? :video : :audio
    track.public_send(attachment_name).attach(blob)
  end
end
