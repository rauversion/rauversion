require "rails_helper"

RSpec.describe "Track masterings", type: :request do
  include ActiveJob::TestHelper

  let(:artist) { create(:user, role: :artist, confirmed_at: Time.current) }
  let(:track) { create(:track, user: artist, title: "Master Me") }

  around do |example|
    previous_adapter = ActiveJob::Base.queue_adapter
    ActiveJob::Base.queue_adapter = :test
    clear_enqueued_jobs
    clear_performed_jobs
    example.run
  ensure
    clear_enqueued_jobs
    clear_performed_jobs
    ActiveJob::Base.queue_adapter = previous_adapter
  end

  describe "GET /tracks/:track_id/masterings/new" do
    it "returns wizard data for the React screen" do
      sign_in artist

      get new_track_mastering_path(track, format: :json)

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)

      expect(payload.dig("track", "title")).to eq("Master Me")
      expect(payload.dig("track_master", "target_profile")).to eq("demo_balanced")
      expect(payload.fetch("target_profiles").map { |profile| profile["key"] }).to include("club_loud")
    end
  end

  describe "POST /tracks/:track_id/masterings" do
    before do
      track.audio.attach(
        io: StringIO.new("fake-audio"),
        filename: "source.wav",
        content_type: "audio/wav"
      )
    end

    it "creates a master request and enqueues processing" do
      sign_in artist

      expect do
        post track_masterings_path(track),
          params: {
            track_master: {
              target_profile: "club_loud",
              feedback: "Mantener pegada y limpiar subgrave.",
              reference_notes: "Para prueba de club."
            }
          },
          as: :json
      end.to change(TrackMaster, :count).by(1)

      master = TrackMaster.last

      expect(master.track).to eq(track)
      expect(master.target_profile).to eq("club_loud")
      expect(master.feedback).to eq("Mantener pegada y limpiar subgrave.")
      expect(enqueued_jobs.map { |job| job.fetch(:job) }).to include(MasterTrackJob)
      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body).dig("track_master", "id")).to eq(master.id)
    end

    it "does not create a request without processable audio" do
      track.audio.purge
      sign_in artist

      expect do
        post track_masterings_path(track),
          params: { track_master: { target_profile: "demo_balanced" } },
          as: :json
      end.not_to change(TrackMaster, :count)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body).fetch("errors")).to include("Este track no tiene audio procesable.")
    end
  end

  describe "GET /tracks/:track_id/masterings/:id" do
    it "returns result data for the React screen" do
      sign_in artist
      master = create(:track_master, track: track, state: "completed", recipe: { target: { profile: "demo_balanced" } })

      get track_mastering_path(track, master, format: :json)

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)

      expect(payload.dig("track_master", "id")).to eq(master.id)
      expect(payload.dig("track_master", "recipe", "target", "profile")).to eq("demo_balanced")
    end
  end

  describe "GET /tracks/:track_id/masterings/:id/download" do
    it "redirects to the result while the file is not ready" do
      sign_in artist
      master = create(:track_master, track: track, state: "running")

      get download_track_mastering_path(track, master)

      expect(response).to redirect_to(track_mastering_path(track, master))
    end
  end
end
