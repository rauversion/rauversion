class MasterTrackJob < ApplicationJob
  queue_as :audio

  def perform(track_master_id)
    track_master = TrackMaster.find(track_master_id)
    Mastering::Pipeline.new(track_master: track_master).call
  rescue StandardError => e
    track_master&.mark_failed!(e.message)
    Rails.logger.error("MasterTrackJob failed track_master_id=#{track_master_id} error=#{e.class}: #{e.message}")
    Mastering::Broadcaster.broadcast(
      track_master,
      event: "failed",
      step: "failed",
      message: "El pre-master fallo: #{e.message}",
      progress: nil,
      level: "error",
      payload: { error_class: e.class.name }
    ) if track_master
    raise
  end
end
