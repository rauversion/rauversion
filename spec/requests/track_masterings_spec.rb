require "rails_helper"

RSpec.describe "Track masterings", type: :request do
  include ActiveJob::TestHelper

  let(:artist) { create(:user, role: :artist, mastering_allowed: true, confirmed_at: Time.current) }
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

    it "rejects users without mastering access" do
      blocked_artist = create(:user, role: :artist, mastering_allowed: false, confirmed_at: Time.current)
      blocked_track = create(:track, user: blocked_artist)
      sign_in blocked_artist

      get new_track_mastering_path(blocked_track, format: :json)

      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body).fetch("errors")).to include("Mastering no esta habilitado para tu cuenta.")
    end
  end

  describe "GET /tracks/:track_id/masterings" do
    it "returns all masterings for the React index" do
      sign_in artist
      older_master = create(:track_master, track: track, state: "completed", created_at: 2.days.ago)
      newer_master = create(:track_master, track: track, state: "failed", created_at: 1.hour.ago)

      get track_masterings_path(track, format: :json)

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)

      expect(payload.dig("track", "title")).to eq("Master Me")
      expect(payload.fetch("masters").map { |master| master["id"] }).to eq([newer_master.id, older_master.id])
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

  describe "POST /tracks/:track_id/masterings/:id/retry" do
    before do
      track.audio.attach(
        io: StringIO.new("fake-audio"),
        filename: "source.wav",
        content_type: "audio/wav"
      )
    end

    it "resets the existing master and enqueues processing with the new prompt" do
      sign_in artist
      master = create(:track_master, track: track, state: "completed", feedback: "old prompt")

      post retry_track_mastering_path(track, master),
        params: {
          track_master: {
            feedback: "menos bombeo, conserva mas transientes"
          }
        },
        as: :json

      expect(response).to have_http_status(:accepted)
      expect(master.reload.state).to eq("pending")
      expect(master.feedback).to eq("menos bombeo, conserva mas transientes")
      expect(enqueued_jobs.map { |job| job.fetch(:job) }).to include(MasterTrackJob)
      expect(JSON.parse(response.body).dig("track_master", "state")).to eq("pending")
    end

    it "does not retry a master already in progress" do
      sign_in artist
      master = create(:track_master, track: track, state: "running")

      post retry_track_mastering_path(track, master),
        params: { track_master: { feedback: "retry" } },
        as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body).fetch("errors")).to include("El master ya esta en proceso.")
    end
  end

  describe "DELETE /tracks/:track_id/masterings/:id" do
    it "deletes a completed mastering" do
      sign_in artist
      master = create(:track_master, track: track, state: "completed")

      expect do
        delete track_mastering_path(track, master), as: :json
      end.to change(TrackMaster, :count).by(-1)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).fetch("deleted_id")).to eq(master.id)
    end

    it "does not delete a mastering that is still processing" do
      sign_in artist
      master = create(:track_master, track: track, state: "running")

      expect do
        delete track_mastering_path(track, master), as: :json
      end.not_to change(TrackMaster, :count)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body).fetch("errors")).to include("No se puede eliminar un master en proceso.")
    end
  end
end
