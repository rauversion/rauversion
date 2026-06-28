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
        audio_url: attachment_path(track.audio),
        mp3_url: attachment_path(track.mp3_audio),
        video_url: attachment_path(track.video_playback_media),
        has_video: track.has_video?,
        duration: track.duration,
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
