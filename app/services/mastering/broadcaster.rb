module Mastering
  class Broadcaster
    def self.broadcast(track_master, event:, step:, message:, progress: nil, level: "info", payload: {})
      new(track_master).broadcast(
        event: event,
        step: step,
        message: message,
        progress: progress,
        level: level,
        payload: payload
      )
    end

    def initialize(track_master)
      @track_master = track_master
    end

    def broadcast(event:, step:, message:, progress: nil, level: "info", payload: {})
      track_master.reload if track_master.persisted?

      log(level, event, step, message, progress)
      ActionCable.server.broadcast(stream_name, cable_payload(event, step, message, progress, level, payload))
    end

    private

    attr_reader :track_master

    def cable_payload(event, step, message, progress, level, payload)
      {
        type: "mastering_progress",
        event: event,
        step: step,
        level: level,
        message: message,
        progress: progress,
        timestamp: Time.current.iso8601,
        track_master: Mastering::TrackMasterSerializer.new(track_master).as_json
      }.merge(payload)
    end

    def stream_name
      "mastering_#{track_master.id}"
    end

    def log(level, event, step, message, progress)
      Rails.logger.public_send(
        level,
        "mastering_pipeline track_master_id=#{track_master.id} track_id=#{track_master.track_id} event=#{event} step=#{step} progress=#{progress || "n/a"} message=#{message}"
      )
    end
  end
end
