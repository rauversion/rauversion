class TrackProcessorJob < ApplicationJob
  queue_as :track_processing

  limits_concurrency to: 1, key: ->(arg) { "track_processing" }

  def perform(track_id)
    track = Track.find(track_id)
    broadcast(track, event: "started", step: "preparing", progress: 5)

    processed = track.reprocess!(
      on_progress: ->(step:, progress:) {
        broadcast(track, event: "progress", step: step, progress: progress)
      }
    )

    if processed
      broadcast(track, event: "completed", step: "completed", progress: 100)
    else
      broadcast(track, event: "failed", step: "source_missing", level: "error")
    end
  rescue StandardError => e
    Rails.logger.error("TrackProcessorJob failed track_id=#{track_id} error=#{e.class}: #{e.message}")
    broadcast(track, event: "failed", step: "failed", level: "error") if track
    raise
  end

  private

  def broadcast(track, event:, step:, progress: nil, level: "info")
    TrackProcessing::Broadcaster.broadcast(
      track,
      event: event,
      step: step,
      progress: progress,
      level: level
    )
  end
end
