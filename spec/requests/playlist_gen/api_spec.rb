require "rails_helper"

RSpec.describe "PlaylistGen API V1", type: :request do
  describe "POST /playlist_gen/api/v1/library_uploads" do
    let(:xml_content) do
      <<~XML
        <?xml version="1.0" encoding="UTF-8"?>
        <DJ_PLAYLISTS Version="1.0.0">
          <COLLECTION Entries="2">
            <TRACK TrackID="1" Name="Track One" Artist="Artist A" Genre="House" AverageBpm="122.50" Tonality="8A" TotalTime="360" Rating="102" Location="file://localhost/Music/track1.mp3"/>
            <TRACK TrackID="2" Name="Track Two" Artist="Artist B" Genre="Tech House" AverageBpm="124.00" Tonality="9A" TotalTime="420" Rating="153" Location="file://localhost/Music/track2.mp3"/>
          </COLLECTION>
        </DJ_PLAYLISTS>
      XML
    end

    it "creates a library upload and imports tracks" do
      file = Rack::Test::UploadedFile.new(
        StringIO.new(xml_content),
        "application/xml",
        original_filename: "collection.xml"
      )

      post "/playlist_gen/api/v1/library_uploads", params: { file: file }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      
      expect(json["status"]).to eq("completed")
      expect(json["source"]).to eq("rekordbox")
      expect(json["total_tracks_imported"]).to eq(2)
      expect(PlaylistGen::Track.count).to eq(2)
    end
  end

  describe "GET /playlist_gen/api/v1/library_uploads/:id" do
    let(:library_upload) do
      PlaylistGen::LibraryUpload.create!(
        status: "completed",
        source: "rekordbox",
        total_tracks_imported: 100
      )
    end

    it "returns the library upload status" do
      get "/playlist_gen/api/v1/library_uploads/#{library_upload.id}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      
      expect(json["id"]).to eq(library_upload.id)
      expect(json["status"]).to eq("completed")
      expect(json["total_tracks_imported"]).to eq(100)
      expect(json["created_at"]).to be_present
    end

    it "returns 404 for non-existent upload" do
      get "/playlist_gen/api/v1/library_uploads/999999"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /playlist_gen/api/v1/sets/generate" do
    before do
      # Create test tracks
      5.times do |i|
        PlaylistGen::Track.create!(
          title: "Track #{i + 1}",
          artist: "Artist #{('A'.ord + i).chr}",
          bpm: 122 + i,
          key: "#{8 + i % 3}A",
          genre: "House",
          energy: 4 + i,
          duration_seconds: 300 + i * 30,
          source: "test"
        )
      end
    end

    it "generates a playlist" do
      post "/playlist_gen/api/v1/sets/generate", params: {
        name: "Peak Time Set",
        duration_minutes: 15,
        bpm_min: 122,
        bpm_max: 126,
        genres: ["House"],
        energy_curve: "linear_up"
      }, as: :json

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      
      expect(json["playlist"]["name"]).to eq("Peak Time Set")
      expect(json["playlist"]["status"]).to eq("generated")
      expect(json["playlist"]["tracks"]).to be_an(Array)
      expect(json["playlist"]["tracks"].first).to include("position", "id", "title", "artist")
    end

    it "returns error when no tracks match" do
      post "/playlist_gen/api/v1/sets/generate", params: {
        duration_minutes: 60,
        bpm_min: 200,
        bpm_max: 210
      }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["error"]).to include("No tracks found")
    end
  end

  describe "GET /playlist_gen/api/v1/playlists" do
    before do
      # Create test playlist
      playlist = PlaylistGen::Playlist.create!(
        name: "Test Playlist",
        duration_seconds: 3600,
        bpm_min: 122,
        bpm_max: 126,
        energy_curve: "linear_up",
        total_tracks: 10,
        status: "generated",
        generated_at: Time.current
      )
    end

    it "returns list of playlists" do
      get "/playlist_gen/api/v1/playlists"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      
      expect(json["playlists"]).to be_an(Array)
      expect(json["playlists"].first["name"]).to eq("Test Playlist")
      expect(json["playlists"].first["duration_human"]).to eq("1h 0m")
    end
  end

  describe "GET /playlist_gen/api/v1/playlists/:id" do
    let(:track) do
      PlaylistGen::Track.create!(
        title: "Test Track",
        artist: "Test Artist",
        bpm: 124,
        key: "8A",
        genre: "House",
        energy: 6,
        duration_seconds: 300
      )
    end

    let(:playlist) do
      p = PlaylistGen::Playlist.create!(
        name: "Test Playlist",
        duration_seconds: 300,
        bpm_min: 122,
        bpm_max: 126,
        energy_curve: "linear_up",
        total_tracks: 1,
        status: "generated",
        generated_at: Time.current
      )
      PlaylistGen::PlaylistTrack.create!(playlist: p, track: track, position: 1)
      p
    end

    it "returns playlist with tracks" do
      get "/playlist_gen/api/v1/playlists/#{playlist.id}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      
      expect(json["playlist"]["name"]).to eq("Test Playlist")
      expect(json["playlist"]["tracks"].size).to eq(1)
      expect(json["playlist"]["tracks"].first["title"]).to eq("Test Track")
      expect(json["playlist"]["tracks"].first["position"]).to eq(1)
    end
  end

  describe "GET /playlist_gen/api/v1/playlists/:id/export_m3u" do
    let(:track) do
      PlaylistGen::Track.create!(
        title: "Test Track",
        artist: "Test Artist",
        bpm: 124,
        key: "8A",
        genre: "House",
        energy: 6,
        duration_seconds: 300,
        file_path: "/Music/test.mp3"
      )
    end

    let(:playlist) do
      p = PlaylistGen::Playlist.create!(
        name: "Test Playlist",
        duration_seconds: 300,
        bpm_min: 122,
        bpm_max: 126,
        energy_curve: "linear_up",
        total_tracks: 1,
        status: "generated",
        generated_at: Time.current
      )
      PlaylistGen::PlaylistTrack.create!(playlist: p, track: track, position: 1)
      p
    end

    it "exports M3U file" do
      get "/playlist_gen/api/v1/playlists/#{playlist.id}/export_m3u"

      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include("audio/x-mpegurl")
      
      content = response.body
      expect(content).to include("#EXTM3U")
      expect(content).to include("#EXTINF:300,Test Artist - Test Track")
      expect(content).to include("/Music/test.mp3")
    end
  end
end
