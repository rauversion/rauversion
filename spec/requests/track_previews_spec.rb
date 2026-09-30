require "rails_helper"

RSpec.describe "Track preview settings", type: :request do
  include ActiveJob::TestHelper

  let(:artist) { create(:user, role: :artist, confirmed_at: Time.current) }
  let(:track) { create(:track, user: artist) }

  before do
    [artist.avatar, track.cover].each do |attachment|
      attachment.attach(
        io: File.open(Rails.root.join("spec/fixtures/files/sample.jpg")),
        filename: "sample.jpg", content_type: "image/jpeg"
      )
    end
    track.audio.attach(
      io: StringIO.new("original audio"), filename: "private-original.wav", content_type: "audio/wav",
      metadata: { duration: 120, analyzed: true }
    )
    track.update!(preview_enabled: true, preview_start_seconds: 20, preview_duration_seconds: 15)
    track.mp3_audio.attach(
      io: StringIO.new("public preview"), filename: "public-preview.mp3", content_type: "audio/mpeg",
      metadata: { playback_signature: track.playback_signature, duration: 15, analyzed: true }
    )
  end

  it "exposes only the preview in public detail and player JSON" do
    original_id = track.audio.blob.signed_id
    get track_path(track, format: :json)

    expect(response).to have_http_status(:ok)
    payload = JSON.parse(response.body).fetch("track")
    expect(payload.values_at("audio_url", "mp3_url", "playback_url").uniq.length).to eq(1)
    expect(payload["audio_url"]).to include("public-preview.mp3")
    expect(response.body).not_to include(original_id, "private-original.wav")
    expect(payload).to include("preview_enabled" => true, "duration" => 15, "original_duration" => 120)

    get player_path(format: :json, id: track.slug)
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).dig("track", "audio_url")).to include("public-preview.mp3")
    expect(JSON.parse(response.body).fetch("track")).to include("preview_enabled" => true, "preview_duration_seconds" => 15)
    expect(response.body).not_to include(original_id, "private-original.wav")
  end

  it "includes preview indicators in playlist detail, embeds and directory data" do
    playlist = create(:playlist, user: artist, private: false, playlist_type: "album")
    playlist.track_playlists.create!(track: track)

    get playlist_path(playlist, format: :json)
    expect(response).to have_http_status(:ok)
    detail_track = JSON.parse(response.body).fetch("playlist").fetch("tracks").first
    expect(detail_track).to include("preview_enabled" => true, "preview_duration_seconds" => 15)
    expect(response.body).not_to include(track.audio.blob.signed_id, "private-original.wav")

    get playlists_path(format: :json)
    expect(response).to have_http_status(:ok)
    listed_playlist = JSON.parse(response.body).fetch("collection").find { |item| item["id"] == playlist.id }
    expect(listed_playlist.fetch("tracks").first).to include("preview_enabled" => true, "preview_duration_seconds" => 15)
    expect(response.body).not_to include(track.audio.blob.signed_id, "private-original.wav")
  end

  it "exposes no original URL while the new preview is pending" do
    track.update!(preview_start_seconds: 25)
    get track_path(track, format: :json)

    expect(response).to have_http_status(:ok)
    payload = JSON.parse(response.body).fetch("track")
    expect(payload.values_at("audio_url", "mp3_url", "playback_url")).to eq([nil, nil, nil])
    expect(response.body).not_to include("private-original.wav")
  end

  it "rejects disabling the preview without confirmation and preserves the existing copy" do
    sign_in artist
    original_preview = track.mp3_audio.blob

    put track_path(track, format: :json), params: { track: { preview_enabled: false } }, as: :json

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)["errors"]).to be_present
    expect(track.reload.preview_enabled?).to eq(true)
    expect(track.mp3_audio.blob).to eq(original_preview)
  end

  it "queues full-length regeneration only after confirmation" do
    sign_in artist
    expect do
      put track_path(track, format: :json), params: {
        track: { preview_enabled: false, confirm_full_length: true }
      }, as: :json
    end.to have_enqueued_job(TrackProcessorJob).with(track.id)

    expect(response).to have_http_status(:ok)
    expect(track.reload.preview_enabled?).to eq(false)
    expect(track.mp3_audio).not_to be_attached
    expect(track.audio).to be_attached
  end

  it "validates the selected window before invalidating the current preview" do
    sign_in artist
    preview_blob = track.mp3_audio.blob
    put track_path(track, format: :json), params: {
      track: { preview_start_seconds: 110, preview_duration_seconds: 30 }
    }, as: :json

    expect(response).to have_http_status(:unprocessable_entity)
    expect(track.reload.mp3_audio.blob).to eq(preview_blob)
    expect(track.preview_start_seconds).to eq(20)
  end

  describe "GET source_metadata" do
    it "returns cached duration without regenerating audio or returning original URLs" do
      sign_in artist
      preview_blob = track.mp3_audio.blob
      expect_any_instance_of(ActiveStorage::Blob).not_to receive(:analyze)

      expect do
        get source_metadata_track_path(track, format: :json)
      end.not_to have_enqueued_job(TrackProcessorJob)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to eq("original_duration" => 120)
      expect(track.reload.mp3_audio.blob).to eq(preview_blob)
    end

    it "reads and persists duration for a legacy original marked analyzed without duration" do
      sign_in artist
      legacy_track = create(:track, user: artist)
      legacy_track.audio.attach(
        io: File.open(Rails.root.join("spec/fixtures/audio.mp3")),
        filename: "legacy.mp3", content_type: "audio/mpeg", metadata: { analyzed: true }
      )
      legacy_track.mp3_audio.attach(
        io: StringIO.new("existing public audio"), filename: "public.mp3", content_type: "audio/mpeg"
      )
      preview_blob = legacy_track.mp3_audio.blob

      get source_metadata_track_path(legacy_track, format: :json)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).fetch("original_duration")).to be_within(0.01).of(0.418)
      expect(legacy_track.reload.original_duration).to be_positive
      expect(legacy_track.mp3_audio.blob).to eq(preview_blob)
    end

    it "requires authentication" do
      get source_metadata_track_path(track, format: :json)
      expect(response).to redirect_to(new_user_session_path(format: :json))
    end

    it "does not let another user analyze an original" do
      sign_in create(:user, confirmed_at: Time.current)
      get source_metadata_track_path(track, format: :json)
      expect(response).to have_http_status(:not_found)
    end

    it "returns a recoverable error when the source has no readable duration" do
      sign_in artist
      track.audio.blob.update!(metadata: { analyzed: true })

      get source_metadata_track_path(track, format: :json)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body).fetch("error")).to be_present
      expect(track.reload.original_duration).to be_nil
    end
  end
end
