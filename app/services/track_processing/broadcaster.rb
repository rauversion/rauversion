module TrackProcessing
  class Broadcaster
    def self.broadcast(track, event:, step:, progress: nil, level: "info")
      track.update_processing_status!(step: step, progress: progress)
      track.reload

      Rails.logger.public_send(
        level,
        "track_processing track_id=#{track.id} event=#{event} step=#{step} progress=#{progress || "n/a"}"
      )

      ActionCable.server.broadcast(
        "track_processing_#{track.id}",
        {
          type: "track_processing",
          event: event,
          step: step,
          progress: progress,
          timestamp: Time.current.iso8601,
          track: TrackProcessing::Serializer.new(track).as_json
        }
      )
    end
  end
end
