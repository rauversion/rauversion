require "rails_helper"

RSpec.describe "Playlists", type: :request do
  describe "GET /playlists/albums.json with IDs" do
    let(:artist) { create(:user, confirmed_at: Time.current, role: :artist) }
    let!(:public_mix) do
      Playlist.create!(user: artist, title: "Public mix", playlist_type: "playlist", private: false)
    end
    let!(:public_album) do
      Playlist.create!(user: artist, title: "Public album", playlist_type: "album", private: false)
    end
    let!(:private_mix) do
      Playlist.create!(user: artist, title: "Private mix", playlist_type: "playlist", private: true)
    end

    it "returns selected public playlists regardless of release type" do
      get albums_playlists_path(
        format: :json,
        ids: [public_mix.id, public_album.id, private_mix.id].join(",")
      )

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).fetch("collection").pluck("id")).to match_array([public_mix.id, public_album.id])
    end

    it "also returns a private selected playlist to its owner" do
      sign_in artist

      get albums_playlists_path(format: :json, ids: private_mix.id)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).fetch("collection").pluck("id")).to eq([private_mix.id])
    end
  end

  describe "GET /playlists/:id.json" do
    let(:artist) { create(:user, confirmed_at: Time.current, role: :artist) }
    let(:listener) { create(:user, confirmed_at: Time.current) }
    let!(:playlist) do
      Playlist.create!(
        user: artist,
        title: "Playlist with likes",
        playlist_type: "playlist"
      )
    end
    let!(:track) do
      Track.create!(
        user: artist,
        title: "Track inside playlist",
        private: false
      )
    end
    let!(:private_track) do
      Track.create!(
        user: artist,
        title: "Private track inside playlist",
        private: true
      )
    end
    let!(:track_playlist) do
      TrackPlaylist.create!(playlist: playlist, track: track, position: 1)
    end
    let!(:private_track_playlist) do
      TrackPlaylist.create!(playlist: playlist, track: private_track, position: 2)
    end
    let!(:track_like) do
      Like.create!(
        liker_type: "User",
        liker_id: listener.id,
        likeable_type: "Track",
        likeable_id: track.id
      )
    end
    let!(:private_playlist) do
      Playlist.create!(
        user: artist,
        title: "Private playlist",
        playlist_type: "playlist",
        private: true
      )
    end
    let!(:private_playlist_track) do
      TrackPlaylist.create!(playlist: private_playlist, track: track, position: 1)
    end

    it "returns tracks without active like state for guests" do
      get "/playlists/#{playlist.slug}.json"

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      playlist_track = json.fetch("playlist").fetch("tracks").first

      expect(playlist_track).to include(
        "id" => track.id,
        "like_id" => false,
        "liked_by_current_user" => false
      )
    end

    it "returns tracks with the current user's like state" do
      sign_in listener

      get "/playlists/#{playlist.slug}.json"

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      playlist_track = json.fetch("playlist").fetch("tracks").first

      expect(playlist_track).to include(
        "id" => track.id,
        "like_id" => true,
        "liked_by_current_user" => true
      )
      expect(json.fetch("playlist").fetch("tracks").map { |item| item["id"] }).to eq([track.id])
    end

    it "does not list private tracks for public visitors" do
      get "/playlists/#{playlist.slug}.json"

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)

      expect(json.fetch("playlist").fetch("tracks").map { |item| item["id"] }).to eq([track.id])
    end

    it "lists private tracks when the playlist owner visits" do
      sign_in artist

      get "/playlists/#{playlist.slug}.json"

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)

      expect(json.fetch("playlist").fetch("tracks").map { |item| item["id"] }).to eq([track.id, private_track.id])
    end

    it "returns a private playlist to its owner" do
      sign_in artist

      get "/playlists/#{private_playlist.slug}.json"

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)

      expect(json.dig("playlist", "id")).to eq(private_playlist.id)
      expect(json.dig("playlist", "private")).to eq(true)
      expect(json.fetch("playlist").fetch("tracks").map { |item| item["id"] }).to eq([track.id])
    end

    it "does not return a private playlist to another user" do
      sign_in listener

      get "/playlists/#{private_playlist.slug}.json"

      expect(response).to have_http_status(:not_found)
    end
  end
end
