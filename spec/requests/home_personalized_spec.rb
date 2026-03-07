require "rails_helper"

RSpec.describe "Personalized home", type: :request do
  describe "GET /home/personalized.json" do
    let(:user) do
      create(
        :user,
        confirmed_at: Time.current,
        username: "listener-home",
        first_name: "Luna",
        last_name: "Listener"
      )
    end

    let(:artist) do
      create(
        :user,
        confirmed_at: Time.current,
        role: :artist,
        username: "artist-home",
        first_name: "Ayla",
        last_name: "Artist"
      )
    end

    let!(:recent_track) do
      Track.create!(
        user: artist,
        title: "Midnight Echo",
        private: false,
        genre: "Ambient",
        tags: ["ambient", "drone"]
      )
    end

    let!(:podcast_track) do
      Track.create!(
        user: artist,
        title: "Night Dispatch",
        private: false,
        podcast: true
      )
    end

    let!(:editor_playlist) do
      Playlist.create!(
        user: artist,
        title: "Editor Selection",
        description: "Curada para explorar sonidos nuevos",
        playlist_type: "playlist",
        editor_choice_position: 1,
        genre: "Ambient",
        tags: ["ambient", "drone"]
      )
    end

    let!(:recommended_playlist) do
      Playlist.create!(
        user: artist,
        title: "Deep Drift",
        description: "Texturas para escucha profunda",
        playlist_type: "playlist",
        genre: "Ambient",
        tags: ["ambient", "textures"]
      )
    end

    let!(:editor_track_link) do
      TrackPlaylist.create!(playlist: editor_playlist, track: recent_track, position: 1)
    end

    let!(:recommended_track_link) do
      TrackPlaylist.create!(playlist: recommended_playlist, track: recent_track, position: 1)
    end

    let!(:event) do
      create(
        :event,
        user: artist,
        title: "Sunrise Session",
        state: "published",
        visibility: "public",
        event_start: 2.days.from_now,
        event_ends: 2.days.from_now + 2.hours,
        city: "Santiago",
        venue: "Sala Rau"
      )
    end

    let!(:track_like) do
      Like.create!(
        liker_type: "User",
        liker_id: user.id,
        likeable_type: "Track",
        likeable_id: recent_track.id,
        created_at: 1.day.ago
      )
    end

    let!(:artist_follow) do
      Follow.create!(
        follower_type: "User",
        follower_id: user.id,
        followable_type: "User",
        followable_id: artist.id,
        created_at: 2.days.ago
      )
    end

    let!(:recent_track_listen) do
      ListeningEvent.create!(
        user: user,
        track: recent_track,
        created_at: 2.hours.ago
      )
    end

    let!(:playlist_listen) do
      ListeningEvent.create!(
        user: user,
        playlist: editor_playlist,
        created_at: 90.minutes.ago
      )
    end

    let!(:podcast_listen) do
      ListeningEvent.create!(
        user: user,
        track: podcast_track,
        created_at: 30.minutes.ago
      )
    end

    it "requires authentication" do
      get "/home/personalized.json"

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to include("error" => "Authentication required")
    end

    it "returns the personalized home payload for the current user" do
      sign_in user

      get "/home/personalized.json"

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      section_ids = json.fetch("sections").map { |section| section.fetch("id") }

      expect(json.fetch("stats")).to include(
        "recent_listens_count" => 3,
        "liked_tracks_count" => 1,
        "followed_artists_count" => 1,
        "upcoming_events_count" => 1
      )

      expect(json.fetch("quick_access").map { |item| item.fetch("title") }).to include(
        I18n.t("home.personalized.library.likes.title"),
        "Editor Selection",
        "Midnight Echo"
      )

      expect(section_ids).to include(
        "recently_played",
        "recommended_playlists",
        "editor_choices",
        "most_played_tracks",
        "podcasts_for_you",
        "upcoming_events"
      )

      recommended = json.fetch("sections").find { |section| section["id"] == "recommended_playlists" }
      events = json.fetch("sections").find { |section| section["id"] == "upcoming_events" }

      expect(recommended.fetch("items").map { |item| item.fetch("title") }).to include("Deep Drift")
      expect(events.fetch("items").map { |item| item.fetch("title") }).to include("Sunrise Session")
    end
  end
end
