# app/models/track_bulk_creator.rb
# require 'active_model'

class TrackBulkCreator
  include ActiveModel::Model

  attr_accessor :tracks_attributes, 
  :step,
  :user, 
  :make_playlist, 
  :private

  validate :validate_tracks

  # Initialize the tracks_attributes with an empty array
  def initialize(attributes = {})
    super(attributes)
    self.private = ActiveRecord::Type::Boolean.new.cast(attributes[:private])
    self.tracks_attributes ||= []
  end

  def tracks_attributes_objects=(attributes)
    # array = attributes.keys.map { |o| attributes[o] }
    self.tracks_attributes = attributes # .map { |o| Track.new(o) }
    # array.map{|o| ScheduleRecord.new(o) }
  end

  def save
    if !valid?
      puts errors.full_messages
      return false
    end
    tracks.each(&:save!)
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

  private

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
