require "rails_helper"

RSpec.describe "Tracks", type: :request do
  describe "GET /tracks.json" do
    let(:artist) { create(:user, confirmed_at: Time.current) }
    let!(:techno_track) do
      create(
        :track,
        user: artist,
        title: "Night Pulse",
        genre: "Techno",
        bpm: 128,
        mood: ["Dark", "Driving"],
        subgenres: ["Peak Time Techno"],
        language: "en",
        instrumental: false,
        analysis_accuracy: 0.92,
        tags: ["warehouse", "peak-time"]
      )
    end
    let!(:ambient_track) do
      create(
        :track,
        user: artist,
        title: "Cloud Memory",
        genre: "Ambient",
        bpm: 94,
        mood: ["Meditative"],
        subgenres: ["Drone"],
        language: "",
        instrumental: true,
        analysis_accuracy: 0.87,
        tags: ["deep-listening"]
      )
    end
    let!(:private_track) do
      create(
        :track,
        user: artist,
        private: true,
        title: "Hidden Signal",
        genre: "Techno",
        bpm: 130,
        mood: ["Dark"],
        analysis_accuracy: 0.95
      )
    end

    before do
      attach_image(artist, :avatar)
      attach_image(techno_track, :cover)
      attach_image(ambient_track, :cover)
      attach_image(private_track, :cover)
    end

    it "returns facets and grouped discovery shelves for public tracks" do
      get tracks_path(format: :json)

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body)

      expect(payload.dig("facets", "genres")).to include(
        include("value" => "Techno", "count" => 1),
        include("value" => "Ambient", "count" => 1)
      )
      expect(payload.dig("facets", "moods")).to include(include("value" => "Dark"))
      expect(payload.dig("discovery_sections", "genres", "items")).to include(
        include("value" => "Techno", "tracks" => include(include("title" => "Night Pulse")))
      )
      expect(payload.fetch("tracks")).to all(include("bpm"))
      expect(payload.dig("meta", "total_count")).to eq(2)
    end

    it "filters by metadata facets" do
      get tracks_path(
        format: :json,
        genre: "Techno",
        mood: "Dark",
        tempo_band: "120-129",
        vocal_mode: "vocal"
      )

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body)

      expect(payload.fetch("tracks").map { |track| track["title"] }).to eq(["Night Pulse"])
      expect(payload.fetch("active_filters")).to include(
        "genre" => "Techno",
        "mood" => "Dark",
        "tempo_band" => "120-129",
        "vocal_mode" => "vocal"
      )
      expect(payload.dig("discovery_sections", "genres", "items")).to eq([])
    end

    it "applies newest sorting to both the main results and discovery shelves" do
      newest_techno_track = create(
        :track,
        user: artist,
        title: "After Hours",
        genre: "Techno",
        bpm: 132,
        mood: ["Dark"],
        subgenres: ["Peak Time Techno"],
        language: "en",
        instrumental: false,
        analysis_accuracy: 0.84,
        tags: ["warehouse"]
      )
      attach_image(newest_techno_track, :cover)

      get tracks_path(format: :json, sort: "latest")

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body)
      techno_section = payload.dig("discovery_sections", "genres", "items").find do |section|
        section["value"] == "Techno"
      end

      expect(payload.fetch("tracks").first["title"]).to eq("After Hours")
      expect(techno_section.fetch("tracks").first["title"]).to eq("After Hours")
      expect(payload.fetch("active_filters")).to include("sort" => "latest")
    end

    it "supports stable random ordering with a seed" do
      get tracks_path(format: :json, sort: "random", seed: "mix-1")
      first_payload = JSON.parse(response.body)
      first_titles = first_payload.fetch("tracks").map { |track| track["title"] }

      get tracks_path(format: :json, sort: "random", seed: "mix-1")
      second_payload = JSON.parse(response.body)
      second_titles = second_payload.fetch("tracks").map { |track| track["title"] }

      expect(second_titles).to eq(first_titles)
      expect(second_payload.fetch("active_filters")).to include("sort" => "random")
    end

    def attach_image(record, attachment_name)
      record.public_send(attachment_name).attach(
        io: File.open(Rails.root.join("spec/fixtures/files/sample.jpg")),
        filename: "sample.jpg",
        content_type: "image/jpeg"
      )
    end
  end

  describe "POST /tracks.json" do
    let(:artist) { create(:user, role: :artist, confirmed_at: Time.current) }

    it "creates a playlist from multiple uploaded tracks when requested" do
      first_blob = audio_blob(filename: "first.wav")
      second_blob = audio_blob(filename: "second.wav")

      sign_in artist

      expect do
        post tracks_path(format: :json),
          params: {
            track_form: {
              step: "info",
              make_playlist: true,
              playlist_title: "Session playlist",
              playlist_type: "album",
              playlist_private: true,
              tracks_attributes: [
                { audio: first_blob.signed_id, title: "First track", private: false },
                { audio: second_blob.signed_id, title: "Second track", private: false }
              ]
            }
          },
          as: :json
      end.to change(Track, :count).by(2)
        .and change(Playlist, :count).by(1)
        .and change(TrackPlaylist, :count).by(2)

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body)
      playlist = Playlist.last

      expect(payload["success"]).to eq(true)
      expect(payload.dig("playlist", "title")).to eq("Session playlist")
      expect(payload.dig("playlist", "playlist_type")).to eq("album")
      expect(payload.dig("playlist", "private")).to eq(true)
      expect(playlist.tracks.order("track_playlists.position").pluck(:title)).to eq(
        ["First track", "Second track"]
      )
    end

    def audio_blob(filename:)
      ActiveStorage::Blob.create_and_upload!(
        io: StringIO.new("fake-audio"),
        filename: filename,
        content_type: "audio/wav"
      )
    end
  end

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

  describe "GET /tracks/:id.json" do
    let(:artist) { create(:user, confirmed_at: Time.current) }
    let(:track) { create(:track, user: artist) }

    before do
      attach_image(artist, :avatar)
      attach_image(track, :cover)

      track.video.attach(
        io: StringIO.new("fake-video"),
        filename: "clip.mp4",
        content_type: "video/mp4"
      )
      track.video_web.attach(
        io: StringIO.new("fake-video-web"),
        filename: "clip-web.mp4",
        content_type: "video/mp4"
      )
      track.audio.attach(
        io: StringIO.new("fake-wav"),
        filename: "clip.wav",
        content_type: "audio/wav"
      )
      track.mp3_audio.attach(
        io: StringIO.new("fake-mp3"),
        filename: "clip.mp3",
        content_type: "audio/mpeg"
      )
    end

    it "includes video and playback assets for video tracks" do
      get track_path(track, format: :json)

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body).fetch("track")

      expect(payload["has_video"]).to eq(true)
      expect(payload["video_url"]).to be_present
      expect(payload["video_url"]).to include("clip-web.mp4")
      expect(payload["audio_url"]).to be_present
      expect(payload["mp3_url"]).to be_present
      expect(payload["playback_url"]).to eq(payload["mp3_url"])
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
