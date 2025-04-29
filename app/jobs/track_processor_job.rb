class TrackProcessorJob < ApplicationJob
  queue_as :track_processing

  limits_concurrency to: 1, key: ->(arg) { "track_processing" }

  def perform(track_id)
    track = Track.find(track_id)
    track.reprocess!
  end
end
