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

      post "/playlist_gen/api/v1/library_uploads", params: { file: file, async: "false" }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      
      expect(json["status"]).to eq("completed")
      expect(json["source"]).to eq("rekordbox")
      expect(json["total_tracks_imported"]).to eq(2)
      expect(PlaylistGen::Track.count).to eq(2)
    end

    it "queues background job for async processing by default" do
      file = Rack::Test::UploadedFile.new(
        StringIO.new(xml_content),
        "application/xml",
        original_filename: "collection.xml"
      )

      expect {
        post "/playlist_gen/api/v1/library_uploads", params: { file: file }
      }.to have_enqueued_job(PlaylistGen::XmlImportJob)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["status"]).to eq("pending")
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

  describe "GET /playlist_gen/api/v1/tracks/:id" do
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

    it "returns track details with stream_url" do
      get "/playlist_gen/api/v1/tracks/#{track.id}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      
      expect(json["track"]["id"]).to eq(track.id)
      expect(json["track"]["title"]).to eq("Test Track")
      expect(json["track"]["stream_url"]).to eq("/playlist_gen/api/v1/tracks/#{track.id}/stream")
    end

    it "returns nil stream_url when file_path is nil" do
      track.update!(file_path: nil)
      get "/playlist_gen/api/v1/tracks/#{track.id}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      
      expect(json["track"]["stream_url"]).to be_nil
    end
  end

  describe "GET /playlist_gen/api/v1/tracks/:id/stream" do
    let(:temp_dir) { "/tmp/playlist_gen_test_audio" }
    let(:test_audio_path) { File.join(temp_dir, "test_track.mp3") }
    
    before do
      FileUtils.mkdir_p(temp_dir)
      # Create a minimal valid MP3-like file for testing
      File.write(test_audio_path, "ID3" + "\x00" * 100)
      
      # Stub the allowed paths to include our temp directory
      stub_const("PlaylistGen::Api::V1::TracksController::ALLOWED_AUDIO_PATHS", ["/tmp"])
    end

    after do
      FileUtils.rm_rf(temp_dir)
    end

    let(:track) do
      PlaylistGen::Track.create!(
        title: "Test Track",
        artist: "Test Artist",
        bpm: 124,
        key: "8A",
        genre: "House",
        energy: 6,
        duration_seconds: 300,
        file_path: test_audio_path
      )
    end

    it "streams the audio file" do
      get "/playlist_gen/api/v1/tracks/#{track.id}/stream"

      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include("audio/mpeg")
      expect(response.headers["Accept-Ranges"]).to eq("bytes")
    end

    it "returns 404 when file_path is nil" do
      track.update!(file_path: nil)
      get "/playlist_gen/api/v1/tracks/#{track.id}/stream"

      expect(response).to have_http_status(:not_found)
      json = JSON.parse(response.body)
      expect(json["error"]).to eq("No file path for this track")
    end

    it "returns 404 when file does not exist" do
      track.update!(file_path: "/tmp/non_existent_file.mp3")
      get "/playlist_gen/api/v1/tracks/#{track.id}/stream"

      expect(response).to have_http_status(:not_found)
    end

    it "returns 403 for unauthorized paths" do
      track.update!(file_path: "/etc/passwd")
      get "/playlist_gen/api/v1/tracks/#{track.id}/stream"

      expect(response).to have_http_status(:forbidden)
      json = JSON.parse(response.body)
      expect(json["error"]).to eq("Access denied")
    end

    it "returns 403 for directory traversal attempts" do
      # Create a file that we'll try to escape from
      track.update!(file_path: "/tmp/../etc/passwd")
      get "/playlist_gen/api/v1/tracks/#{track.id}/stream"

      expect(response).to have_http_status(:forbidden)
    end

    it "supports range requests for seeking" do
      get "/playlist_gen/api/v1/tracks/#{track.id}/stream", headers: { "Range" => "bytes=0-50" }

      expect(response).to have_http_status(206)
      expect(response.headers["Content-Range"]).to match(/bytes 0-50\/\d+/)
      expect(response.headers["Accept-Ranges"]).to eq("bytes")
    end

    it "returns 415 for unsupported audio formats" do
      unsupported_path = File.join(temp_dir, "test.xyz")
      File.write(unsupported_path, "test content")
      track.update!(file_path: unsupported_path)
      
      get "/playlist_gen/api/v1/tracks/#{track.id}/stream"

      expect(response).to have_http_status(:unsupported_media_type)
      json = JSON.parse(response.body)
      expect(json["error"]).to eq("Unsupported audio format")
    end
  end
end
