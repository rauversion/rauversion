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
      blob = ActiveStorage::Blob.find_signed(attributes[:audio])
      t = Track.new(attributes)
      t.title = File.basename(blob.filename.to_s, File.extname(blob.filename.to_s)) unless t.title.present?
      t.user = user
      t.private = ActiveRecord::Type::Boolean.new.cast(attributes[:private])
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
end
