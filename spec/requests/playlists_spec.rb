require "rails_helper"

RSpec.describe "Playlists", type: :request do
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
    let!(:track_playlist) do
      TrackPlaylist.create!(playlist: playlist, track: track, position: 1)
    end
    let!(:track_like) do
      Like.create!(
        liker_type: "User",
        liker_id: listener.id,
        likeable_type: "Track",
        likeable_id: track.id
      )
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
    end
  end
end
