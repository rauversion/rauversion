require "rails_helper"

RSpec.describe "Api::V1::TrackAnalyses", type: :request do
  describe "POST /api/v1/track_analyses" do
    let(:user) { create(:user, confirmed_at: Time.current, role: "admin") }

    it "returns unauthorized for guests" do
      post "/api/v1/track_analyses"

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to eq("error" => "Authentication required")
    end

    it "requires a track_id" do
      sign_in user

      post "/api/v1/track_analyses"

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)).to eq("error" => "track_id is required")
    end

    it "returns not found when the track does not belong to the user" do
      sign_in user

      post "/api/v1/track_analyses", params: { track_id: 999_999 }

      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)).to eq("error" => "Track not found")
    end

    it "returns the analysis payload from the service" do
      sign_in user

      track = create(:track, user: user)

      analyzer = instance_double(
        TrackAudioAnalysisService,
        call: {
          accuracy: 0.84,
          genre: "House",
          bpm: 126,
          reference_artists: ["Kerri Chandler", "Moodymann"],
          source_metadata: {
            track_id: track.id,
            filename: "audio.mp3",
            content_type: "audio/mpeg"
          }
        }
      )

      allow(TrackAudioAnalysisService).to receive(:new).and_return(analyzer)

      post "/api/v1/track_analyses", params: { track_id: track.id, duration_seconds: 45, persist: true }

      expect(TrackAudioAnalysisService).to have_received(:new).with(
        track: track,
        start_seconds: nil,
        duration_seconds: "45",
        persist: true
      )
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to include(
        "accuracy" => 0.84,
        "genre" => "House",
        "bpm" => 126,
        "reference_artists" => ["Kerri Chandler", "Moodymann"]
      )
    end

    it "accepts the perist alias for persist" do
      sign_in user

      track = create(:track, user: user)
      allow(TrackAudioAnalysisService).to receive(:new).and_return(
        instance_double(TrackAudioAnalysisService, call: { accuracy: 0.5 })
      )

      post "/api/v1/track_analyses", params: { track_id: track.id, perist: "true" }

      expect(TrackAudioAnalysisService).to have_received(:new).with(
        track: track,
        start_seconds: nil,
        duration_seconds: nil,
        persist: true
      )
      expect(response).to have_http_status(:ok)
    end
  end
end
