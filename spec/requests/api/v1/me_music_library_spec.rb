require "rails_helper"

RSpec.describe "Api::V1::Me music library", type: :request do
  describe "GET /api/v1/me/music_library" do
    let(:user) { create(:user, confirmed_at: Time.current) }
    let(:artist) do
      create(
        :user,
        confirmed_at: Time.current,
        role: :artist,
        username: "guest-artist",
        first_name: "Guest",
        last_name: "Artist"
      )
    end

    let(:featured_artist) do
      create(
        :user,
        confirmed_at: Time.current,
        role: :artist,
        username: "featured-artist",
        first_name: "Featured",
        last_name: "Artist"
      )
    end

    let!(:playlist) do
      Playlist.create!(
        user: user,
        title: "Radar semanal",
        description: "Selección personal",
        playlist_type: "playlist"
      )
    end

    let!(:album) do
      Playlist.create!(
        user: user,
        title: "Mi álbum",
        description: "Lanzamiento",
        playlist_type: "album"
      )
    end

    let!(:playlist_track) do
      Track.create!(
        user: artist,
        title: "Track biblioteca",
        private: false
      )
    end

    let!(:liked_track) do
      Track.create!(
        user: artist,
        title: "Track favorito",
        private: false
      )
    end

    let!(:playlist_track_link) do
      TrackPlaylist.create!(playlist: playlist, track: playlist_track, position: 1)
    end

    let!(:album_track_link) do
      TrackPlaylist.create!(playlist: album, track: liked_track, position: 1)
    end

    let!(:featured_credit) do
      TrackArtist.create!(track: liked_track, user: featured_artist)
    end

    let!(:track_like) do
      Like.create!(
        liker_type: "User",
        liker_id: user.id,
        likeable_type: "Track",
        likeable_id: liked_track.id
      )
    end

    it "returns unauthorized for guests" do
      get "/api/v1/me/music_library"

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to include("error" => "Authentication required")
    end

    it "returns paginated library data and filter counts for the current user" do
      sign_in user

      get "/api/v1/me/music_library", params: { filter: "all", per: 2 }

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)

      expect(json["filter"]).to eq("all")
      expect(json["sort"]).to eq("recent")
      expect(json["counts"]).to include(
        "playlists" => 1,
        "albums" => 1,
        "artists" => 2,
        "likes" => 1
      )
      expect(json["metadata"]).to include(
        "current_page" => 1,
        "total_pages" => 3,
        "total_count" => 5
      )
      expect(json["collection"].first["entity_type"]).to eq("likes")
    end

    it "returns artists extracted from playlist tracks" do
      sign_in user

      get "/api/v1/me/music_library", params: { filter: "artists" }

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      titles = json["collection"].map { |entry| entry["title"] }

      expect(json["filter"]).to eq("artists")
      expect(titles).to include(artist.full_name, featured_artist.full_name)
    end

    it "supports sorting entries alphabetically" do
      sign_in user

      get "/api/v1/me/music_library", params: { filter: "artists", sort: "alphabetical" }

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)

      expect(json["sort"]).to eq("alphabetical")
      expect(json["collection"].map { |entry| entry["title"] }).to eq(
        [featured_artist.full_name, artist.full_name]
      )
    end
  end

  describe "GET /api/v1/me/liked_tracks" do
    let(:user) { create(:user, confirmed_at: Time.current) }
    let(:artist) do
      create(
        :user,
        confirmed_at: Time.current,
        role: :artist,
        username: "liked-artist",
        first_name: "Liked",
        last_name: "Artist"
      )
    end

    let!(:track) do
      Track.create!(
        user: artist,
        title: "Cancion favorita",
        private: false,
        metadata: { album_title: "Album favorito" }
      )
    end

    let!(:track_like) do
      Like.create!(
        liker_type: "User",
        liker_id: user.id,
        likeable_type: "Track",
        likeable_id: track.id
      )
    end

    it "returns the liked tracks page payload for the authenticated user" do
      sign_in user

      get "/api/v1/me/liked_tracks"

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)

      expect(json["liked_playlist"]).to include(
        "title" => "Tus me gusta",
        "username" => user.username,
        "tracks_count" => 1
      )
      expect(json["collection"].first).to include(
        "title" => "Cancion favorita",
        "album_title" => "Album favorito",
        "url" => "/tracks/#{track.slug}"
      )
      expect(json["metadata"]).to include(
        "current_page" => 1,
        "total_count" => 1
      )
    end
  end
end
