require "rails_helper"

RSpec.describe "Turn video generation", type: :request do
  let(:user) { create(:user, confirmed_at: Time.current, role: :artist) }
  let(:cover_image) { fixture_file_upload("spec/fixtures/files/sample.jpg", "image/jpeg") }
  let(:audio_file) { fixture_file_upload("spec/fixtures/audio.mp3", "audio/mpeg") }

  before do
    sign_in user
  end

  describe "POST /turn/generate_video" do
    it "uploads source files to Active Storage and enqueues blob-backed processing" do
      enqueued_args = nil

      expect(GenerateVideoJob).to receive(:perform_later) do |args|
        enqueued_args = args
      end

      post "/turn/generate_video",
           params: {
             cover_image: cover_image,
             audio_file: audio_file,
             duration: "12",
             loop_speed: "33",
             audio_start: "1.5",
             audio_end: "9.5",
             bg_color: "#faafc8",
             disc_size: "80"
           },
           headers: { "ACCEPT" => "application/json" }

      expect(response).to have_http_status(:success)

      json = JSON.parse(response.body)
      expect(json["success"]).to eq(true)
      expect(enqueued_args[:user_id]).to eq(user.id)
      expect(enqueued_args[:cover_image_blob_id]).to be_present
      expect(enqueued_args[:audio_file_blob_id]).to be_present
      expect(enqueued_args[:options]).to include(
        audio_start: "1.5",
        audio_end: "9.5",
        bg_color: "#faafc8",
        disc_size: "80",
        duration: "12",
        loop_speed: "33"
      )

      cover_blob = ActiveStorage::Blob.find(enqueued_args[:cover_image_blob_id])
      audio_blob = ActiveStorage::Blob.find(enqueued_args[:audio_file_blob_id])

      expect(cover_blob.filename.to_s).to eq("sample.jpg")
      expect(audio_blob.filename.to_s).to eq("audio.mp3")

      cover_blob.purge
      audio_blob.purge
    end

    it "returns an error when required files are missing" do
      post "/turn/generate_video", params: {}, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)).to include(
        "success" => false,
        "error" => "cover_image and audio_file are required"
      )
    end
  end
end
