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
    expect(JSON.parse(response.body).fetch("track")).to include("can_edit" => true, "can_change_artist" => true)

    get "/#{label.username}/tracks.json"

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).fetch("collection").find { |item| item["id"] == track.id })
      .to include("can_edit" => true, "can_change_artist" => true)
  end

  context "when selecting the publishing artist" do
    let(:new_artist) { create(:user, role: :artist, confirmed_at: Time.current, display_name: "New Artist") }

    it "lists only active artists from the label in the current tenant" do
      pending_artist = create(:user, role: :artist)
      listener = create(:user, role: :user)
      foreign_artist = Current.set(tenant: create(:tenant)) { create(:user, role: :artist) }
      create(:connected_account, parent: label, user: new_artist, state: "active")
      create(:connected_account, parent: label, user: pending_artist, state: "pending")
      create(:connected_account, parent: label, user: listener, state: "active")
      create(:connected_account, parent: label, user: foreign_artist, state: "active")
      sign_in label

      get track_path(track, format: :json)

      expect(JSON.parse(response.body).dig("track", "label_artists")).to eq([
        { "id" => new_artist.id, "username" => new_artist.username, "display_name" => "New Artist" }
      ])
    end

    it "changes the artist while preserving the label, tenant and media" do
      create(:connected_account, parent: label, user: new_artist, state: "active")
      audio_id = track.audio.blob_id
      cover_id = track.cover.blob_id
      tenant_id = track.tenant_id
      sign_in label

      update_artist(new_artist.id, title: "Reassigned track")

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).dig("track", "user", "id")).to eq(new_artist.id)
      expect(track.reload).to have_attributes(user_id: new_artist.id, label_id: label.id,
                                             tenant_id: tenant_id, title: "Reassigned track")
      expect(track.audio.blob_id).to eq(audio_id)
      expect(track.cover.blob_id).to eq(cover_id)

      put track_path(track, format: :json), params: { track: { description: "Still editable by the label" } }, as: :json
      expect(response).to have_http_status(:ok)
      expect(track.reload.description).to eq("Still editable by the label")
    end

    it "can assign a track published under the label account to its artist" do
      track.update!(user: label, label: nil)
      create(:connected_account, parent: label, user: new_artist, state: "active")
      sign_in label

      update_artist(new_artist.id)

      expect(response).to have_http_status(:ok)
      expect(track.reload).to have_attributes(user_id: new_artist.id, label_id: label.id)
      expect(JSON.parse(response.body).fetch("track")).to include("can_edit" => true, "can_change_artist" => true)
    end

    it "preserves an unchanged publishing artist even without an active connection" do
      sign_in label

      update_artist(artist.id, title: "Same artist")

      expect(response).to have_http_status(:ok)
      expect(track.reload).to have_attributes(user_id: artist.id, label_id: label.id, title: "Same artist")
    end

    it "rejects an artist from another label without persisting any fields or featured artists" do
      other_label = create(:user, role: :artist, label: true)
      create(:connected_account, parent: other_label, user: new_artist, state: "active")
      original_title = track.title
      sign_in label

      update_artist(new_artist.id, title: "Rejected change", artist_ids: [new_artist.id])

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)).to include("success" => false,
        "errors" => [I18n.t("tracks.edit.messages.invalid_label_artist")])
      expect(track.reload).to have_attributes(user_id: artist.id, label_id: label.id, title: original_title)
      expect(track.artist_ids).to eq([])
    end

    it "rejects a pending artist connection" do
      create(:connected_account, parent: label, user: new_artist, state: "pending")
      sign_in label

      update_artist(new_artist.id)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(track.reload.user_id).to eq(artist.id)
    end

    it "rejects an artist from another tenant" do
      foreign_artist = Current.set(tenant: create(:tenant)) { create(:user, role: :artist) }
      create(:connected_account, parent: label, user: foreign_artist, state: "active")
      sign_in label

      update_artist(foreign_artist.id)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(track.reload.user_id).to eq(artist.id)
    end

    it "rejects a connected listener account" do
      listener = create(:user, role: :user)
      create(:connected_account, parent: label, user: listener, state: "active")
      sign_in label

      update_artist(listener.id)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(track.reload.user_id).to eq(artist.id)
    end

    [nil, -1].each do |invalid_id|
      it "rejects an invalid artist selection (#{invalid_id.inspect})" do
        sign_in label

        update_artist(invalid_id)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(track.reload.user_id).to eq(artist.id)
      end
    end

    it "rejects artist changes from a regular account even with an active connection" do
      create(:connected_account, parent: artist, user: new_artist, state: "active")
      sign_in artist

      get track_path(track, format: :json)
      expect(JSON.parse(response.body).fetch("track")).to include("can_change_artist" => false)
      expect(JSON.parse(response.body).fetch("track")).not_to have_key("label_artists")

      update_artist(new_artist.id, title: "Rejected change")

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)["errors"]).to eq([I18n.t("tracks.edit.messages.artist_assignment_forbidden")])
      expect(track.reload.user_id).to eq(artist.id)
      expect(track.title).not_to eq("Rejected change")
    end

    it "does not persist artist or featured artist changes when track validation fails" do
      create(:connected_account, parent: label, user: new_artist, state: "active")
      sign_in label

      update_artist(new_artist.id, preview_enabled: true, preview_start_seconds: 115,
                    preview_duration_seconds: 30, artist_ids: [new_artist.id])

      expect(response).to have_http_status(:unprocessable_entity)
      expect(track.reload).to have_attributes(user_id: artist.id, label_id: label.id, preview_enabled: false)
      expect(track.artist_ids).to eq([])
    end

    it "saves featured artists independently of the publishing artist" do
      create(:connected_account, parent: label, user: new_artist, state: "active")
      sign_in label

      update_artist(new_artist.id, artist_ids: [artist.id])

      expect(response).to have_http_status(:ok)
      expect(track.reload.user_id).to eq(new_artist.id)
      expect(track.artist_ids).to eq([artist.id])
    end

    def update_artist(artist_id, **attributes)
      put track_path(track, format: :json), params: { track: attributes.merge(artist_id: artist_id) }, as: :json
    end
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
    expect(JSON.parse(response.body).dig("track", "can_change_artist")).to eq(false)
    expect(JSON.parse(response.body).fetch("track")).not_to have_key("label_artists")

    put track_path(track, format: :json), params: { track: { title: "Unauthorized edit" } }, as: :json

    expect(response).to redirect_to(new_user_session_path(format: :json))
    expect(track.reload.title).not_to eq("Unauthorized edit")
  end

  it "rejects another label for editing and source metadata" do
    sign_in create(:user, role: :artist, label: true, confirmed_at: Time.current)

    get track_path(track, format: :json)
    expect(JSON.parse(response.body).dig("track", "can_edit")).to eq(false)
    expect(JSON.parse(response.body).dig("track", "can_change_artist")).to eq(false)
    expect(JSON.parse(response.body).fetch("track")).not_to have_key("label_artists")

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
