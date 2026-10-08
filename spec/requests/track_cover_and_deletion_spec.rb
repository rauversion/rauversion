require "rails_helper"

RSpec.describe "Track covers and deletion", type: :request do
  let(:artist) { create(:user, role: :artist, confirmed_at: Time.current) }
  let(:track) { create(:track, user: artist) }

  describe "GET /tracks/:id.json" do
    before do
      artist.avatar.attach(
        io: File.open(Rails.root.join("spec/fixtures/files/sample.jpg")),
        filename: "artist.jpg", content_type: "image/jpeg"
      )
    end

    it "uses the artist's image when the track has no cover" do
      get track_path(track, format: :json)

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body).fetch("track")
      avatars = payload.dig("user", "avatar_url")
      expect(payload.fetch("cover_url")).to eq(
        "small" => avatars.fetch("small"), "medium" => avatars.fetch("medium"),
        "large" => avatars.fetch("large"), "original" => avatars.fetch("large"),
        "cropped_image" => avatars.fetch("large")
      )
    end

    it "uses the publishing artist's image for a track linked to a label" do
      label = create(:user, role: :artist, label: true)
      label.avatar.attach(
        io: File.open(Rails.root.join("spec/fixtures/files/sample.jpg")),
        filename: "label.jpg", content_type: "image/jpeg"
      )
      track.update!(label: label)

      get track_path(track, format: :json)

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body).fetch("track")
      expect(payload.dig("cover_url", "cropped_image")).to eq(payload.dig("user", "avatar_url", "large"))
      expect(payload.dig("cover_url", "cropped_image")).not_to eq(payload.dig("label", "avatar_url", "large"))
    end

    it "ignores old crop coordinates when the track no longer has a cover" do
      track.update!(crop_data: { "x" => 0, "y" => 0, "width" => 100, "height" => 100 })

      get track_path(track, format: :json)

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body).fetch("track")
      expect(payload.dig("cover_url", "cropped_image")).to eq(payload.dig("user", "avatar_url", "large"))
    end

    it "keeps the track's own cover when one is attached" do
      track.cover.attach(
        io: File.open(Rails.root.join("spec/fixtures/files/sample.jpg")),
        filename: "cover.jpg", content_type: "image/jpeg"
      )
      track.update!(crop_data: { "x" => 0, "y" => 0, "width" => 100, "height" => 100 })

      get track_path(track, format: :json)

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body).fetch("track")
      expect(payload.dig("cover_url", "large")).to eq(track.cover_url(:large))
      expect(payload.dig("cover_url", "cropped_image")).to include("cover.jpg")
      expect(payload.dig("cover_url", "cropped_image")).not_to eq(payload.dig("user", "avatar_url", "large"))
    end

    it "uses the default image when neither the track nor the artist has an image" do
      artist.avatar.purge

      get track_path(track, format: :json)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).dig("track", "cover_url").values.uniq).to eq([AlbumsHelper.default_image_sqr])
    end
  end

  describe "DELETE /tracks/:id.json" do
    it "deletes the track and its associations with every playlist" do
      playlists = create_list(:playlist, 2, user: artist)
      playlists.each { |playlist| playlist.track_playlists.create!(track: track) }
      track_id = track.id
      sign_in artist

      expect do
        delete track_path(track, format: :json)
      end.to change(Track, :count).by(-1).and change(TrackPlaylist, :count).by(-2)

      expect(response).to have_http_status(:no_content)
      expect(TrackPlaylist.where(track_id: track_id)).to be_empty
      expect(Playlist.where(id: playlists.map(&:id)).count).to eq(2)
    end

    it "preserves other tracks and closes the gap in playlist positions" do
      playlist = create(:playlist, user: artist)
      first_track, last_track = create_list(:track, 2, user: artist)
      [first_track, track, last_track].each { |item| playlist.track_playlists.create!(track: item) }
      sign_in artist

      delete track_path(track, format: :json)

      expect(response).to have_http_status(:no_content)
      expect(playlist.track_playlists.by_position.pluck(:track_id, :position)).to eq([
        [first_track.id, 1], [last_track.id, 2]
      ])
      expect(Track.where(id: [first_track.id, last_track.id]).count).to eq(2)
    end

    it "preserves playlist associations when another user tries to delete the track" do
      playlist = create(:playlist, user: artist)
      association = playlist.track_playlists.create!(track: track)
      sign_in create(:user, role: :artist, confirmed_at: Time.current)

      expect do
        delete track_path(track, format: :json)
      end.not_to change { [Track.count, TrackPlaylist.count] }

      expect(response).to have_http_status(:not_found)
      expect(TrackPlaylist.exists?(association.id)).to eq(true)
    end
  end
end
