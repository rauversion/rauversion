module TrackProcessing
  class Serializer
    def initialize(track)
      @track = track
    end

    def as_json(*)
      {
        id: track.id,
        state: track.state,
        processed: track.processed?,
        processing_step: track.processing_step || (track.processed? ? "completed" : "queued"),
        processing_progress: track.processing_progress || (track.processed? ? 100 : 0),
        playback_url: attachment_path(track.playback_media),
        audio_url: attachment_path(track.playback_media),
        mp3_url: attachment_path(track.playback_media),
        video_url: attachment_path(track.video_playback_media),
        has_video: track.has_video?,
        duration: track.duration,
        original_duration: track.original_duration,
        preview_enabled: track.preview_enabled?,
        preview_start_seconds: track.preview_start_seconds,
        preview_duration_seconds: track.preview_duration_seconds,
        peaks: track.peaks
      }
    end

    private

    attr_reader :track

    def attachment_path(attachment)
      MediaStreamUrl.for(attachment)
    end
  end
end
