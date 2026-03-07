require "rails_helper"

RSpec.describe "Tracks", type: :request do
  describe "GET /tracks/:id/appears_on.json" do
    let(:artist) { create(:user, confirmed_at: Time.current) }
    let(:track) { create(:track, user: artist) }
    let!(:album) do
      create(
        :playlist,
        user: artist,
        title: "Album appearance",
        playlist_type: "album",
        private: false,
        release_date: Date.new(2025, 1, 10)
      )
    end
    let!(:playlist) do
      create(
        :playlist,
        user: artist,
        title: "Playlist appearance",
        playlist_type: "playlist",
        private: false,
        release_date: Date.new(2025, 2, 10)
      )
    end
    let!(:private_playlist) do
      create(
        :playlist,
        user: artist,
        title: "Private appearance",
        playlist_type: "playlist",
        private: true
      )
    end

    before do
      attach_image(artist, :avatar)
      TrackPlaylist.create!(track: track, playlist: album, position: 1)
      TrackPlaylist.create!(track: track, playlist: playlist, position: 2)
      TrackPlaylist.create!(track: track, playlist: private_playlist, position: 3)
    end

    it "returns public appearances ordered with releases first" do
      get appears_on_track_path(track, format: :json)

      expect(response).to have_http_status(:ok)
      expect(parsed_playlists.map { |item| item["slug"] }).to eq([album.slug, playlist.slug])
      expect(parsed_playlists.first["playlist_type"]).to eq("album")
      expect(parsed_playlists.first.dig("user", "username")).to eq(artist.username)
      expect(parsed_playlists.first.dig("cover_url", "medium")).to be_present
    end

    it "includes the owner's private playlists when signed in" do
      sign_in artist

      get appears_on_track_path(track, format: :json)

      expect(response).to have_http_status(:ok)
      expect(parsed_playlists.map { |item| item["slug"] }).to include(private_playlist.slug)
    end

    def parsed_playlists
      JSON.parse(response.body).fetch("playlists")
    end

    def attach_image(record, attachment_name)
      record.public_send(attachment_name).attach(
        io: File.open(Rails.root.join("spec/fixtures/files/sample.jpg")),
        filename: "sample.jpg",
        content_type: "image/jpeg"
      )
    end
  end
end
