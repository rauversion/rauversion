require "rails_helper"

RSpec.describe "Label track editing", type: :request do
  include ActiveJob::TestHelper

  let(:artist) { create(:user, role: :artist, confirmed_at: Time.current) }
  let(:label) { create(:user, role: :artist, label: true, confirmed_at: Time.current) }
  let(:track) { create(:track, user: artist, label: label, private: true) }

  before do
    [artist.avatar, track.cover].each do |attachment|
      attachment.attach(
        io: File.open(Rails.root.join("spec/fixtures/files/sample.jpg")),
        filename: "sample.jpg", content_type: "image/jpeg"
      )
    end
    track.audio.attach(
      io: StringIO.new("original audio"), filename: "original.wav", content_type: "audio/wav",
      metadata: { duration: 120, analyzed: true }
    )
  end

  it "allows the linked label to edit without changing the artist or label" do
    sign_in label

    put track_path(track, format: :json), params: {
      track: { title: "Edited by label", description: "Updated description", private: false,
               user_id: label.id, label_id: artist.id }
    }, as: :json

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)["success"]).to eq(true)
    expect(track.reload).to have_attributes(
      title: "Edited by label", description: "Updated description", private: false,
      user_id: artist.id, label_id: label.id
    )
  end

  it "allows the linked label to open the edit page" do
    sign_in label

    get edit_track_path(track)

    expect(response).to have_http_status(:ok)
  end

  it "exposes edit permission in track detail and the label's track list" do
    sign_in label

    get track_path(track, format: :json)

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).dig("track", "can_edit")).to eq(true)

    get "/#{label.username}/tracks.json"

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).fetch("collection").find { |item| item["id"] == track.id })
      .to include("can_edit" => true)
  end

  it "allows the linked label to read source duration for preview editing" do
    sign_in label

    get source_metadata_track_path(track, format: :json)

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)).to eq("original_duration" => 120)
    expect(response.headers["Cache-Control"]).to eq("private, no-store")
  end

  it "allows the linked label to save preview settings and queues processing" do
    sign_in label

    expect do
      put track_path(track, format: :json), params: {
        track: { preview_enabled: true, preview_start_seconds: 20, preview_duration_seconds: 15 }
      }, as: :json
    end.to have_enqueued_job(TrackProcessorJob).with(track.id)

    expect(response).to have_http_status(:ok)
    expect(track.reload).to have_attributes(
      preview_enabled: true, preview_start_seconds: 20, preview_duration_seconds: 15
    )
  end

  it "preserves the owner's edit permission" do
    sign_in artist

    get track_path(track, format: :json)
    expect(JSON.parse(response.body).dig("track", "can_edit")).to eq(true)

    put track_path(track, format: :json), params: { track: { title: "Edited by artist" } }, as: :json

    expect(response).to have_http_status(:ok)
    expect(track.reload.title).to eq("Edited by artist")
  end

  it "does not grant edit permission to guests" do
    get track_path(track, format: :json)

    expect(JSON.parse(response.body).dig("track", "can_edit")).to eq(false)

    put track_path(track, format: :json), params: { track: { title: "Unauthorized edit" } }, as: :json

    expect(response).to redirect_to(new_user_session_path(format: :json))
    expect(track.reload.title).not_to eq("Unauthorized edit")
  end

  it "rejects another label for editing and source metadata" do
    sign_in create(:user, role: :artist, label: true, confirmed_at: Time.current)

    get track_path(track, format: :json)
    expect(JSON.parse(response.body).dig("track", "can_edit")).to eq(false)

    get edit_track_path(track)
    expect(response).to have_http_status(:not_found)

    put track_path(track, format: :json), params: { track: { title: "Unauthorized edit" } }, as: :json
    expect(response).to have_http_status(:not_found)
    expect(track.reload.title).not_to eq("Unauthorized edit")

    get source_metadata_track_path(track, format: :json)
    expect(response).to have_http_status(:not_found)
  end

  it "requires the linked account to be a label" do
    label.update!(label: false)
    sign_in label

    get track_path(track, format: :json)
    expect(JSON.parse(response.body).dig("track", "can_edit")).to eq(false)

    put track_path(track, format: :json), params: { track: { title: "Unauthorized edit" } }, as: :json
    expect(response).to have_http_status(:not_found)
  end

  it "does not grant access through the artist connection alone" do
    create(:connected_account, parent: label, user: artist, state: "active")
    track.update!(label: nil)
    sign_in label

    put track_path(track, format: :json), params: { track: { title: "Unauthorized edit" } }, as: :json

    expect(response).to have_http_status(:not_found)
    expect(track.reload.title).not_to eq("Unauthorized edit")
  end

  it "rejects a linked track from another tenant" do
    track.update!(tenant: create(:tenant))
    sign_in label

    get edit_track_path(track)
    expect(response).to have_http_status(:not_found)

    sign_in label
    put track_path(track, format: :json), params: { track: { title: "Unauthorized edit" } }, as: :json
    expect(response).to have_http_status(:not_found)
    expect(track.reload.title).not_to eq("Unauthorized edit")

    sign_in label
    get source_metadata_track_path(track, format: :json)
    expect(response).to have_http_status(:not_found)
  end

  it "keeps deletion restricted to the owner" do
    sign_in label

    expect { delete track_path(track, format: :json) }.not_to change(Track, :count)
    expect(response).to have_http_status(:not_found)

    sign_in artist

    expect { delete track_path(track, format: :json) }.to change(Track, :count).by(-1)
    expect(response).to have_http_status(:no_content)
  end
end
