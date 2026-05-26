module Mastering
  class TrackMasterSerializer
    def initialize(track_master)
      @track_master = track_master
      @track = track_master.track
    end

    def as_json(*)
      {
        id: track_master.id,
        target_profile: track_master.target_profile,
        state: track_master.state,
        feedback: track_master.feedback,
        reference_notes: track_master.reference_notes,
        recipe: track_master.recipe,
        analysis_before: track_master.analysis_before,
        analysis_after: track_master.analysis_after,
        error_message: track_master.error_message,
        started_at: track_master.started_at,
        completed_at: track_master.completed_at,
        failed_at: track_master.failed_at,
        created_at: track_master.created_at,
        ready: track_master.ready?,
        audio_url: audio_url,
        download_url: download_url
      }
    end

    private

    attr_reader :track_master, :track

    def audio_url
      return unless track_master.audio.attached?

      routes.rails_blob_path(track_master.audio, only_path: true)
    end

    def download_url
      return unless track_master.ready?

      routes.download_track_mastering_path(track, track_master)
    end

    def routes
      Rails.application.routes.url_helpers
    end
  end
end
