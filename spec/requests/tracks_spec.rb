require "rails_helper"

RSpec.describe "Tracks", type: :request do
  describe "GET /tracks/by_id.json" do
    let(:artist) { create(:user, confirmed_at: Time.current) }
    let(:listener) { create(:user, confirmed_at: Time.current) }
    let!(:public_mix) { create(:track, user: artist, title: "Public mix", private: false, dj_set: true) }
    let!(:private_mix) { create(:track, user: artist, title: "Private mix", private: true, dj_set: true) }

    it "returns only published mixes to guests" do
      get by_id_tracks_path(format: :json, ids: [public_mix.id, private_mix.id].join(","))

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).fetch("collection").pluck("id")).to eq([public_mix.id])
    end

    it "also returns private mixes owned by the authenticated user" do
      sign_in artist

      get by_id_tracks_path(format: :json, ids: [public_mix.id, private_mix.id].join(","))

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).fetch("collection").pluck("id")).to match_array([public_mix.id, private_mix.id])
    end

    it "does not expose private mixes to another authenticated user" do
      sign_in listener

      get by_id_tracks_path(format: :json, ids: [public_mix.id, private_mix.id].join(","))

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).fetch("collection").pluck("id")).to eq([public_mix.id])
    end
  end

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
    let!(:dj_set_track) do
      create(
        :track,
        user: artist,
        title: "Warehouse Broadcast",
        genre: "House",
        bpm: 124,
        mood: ["Warm"],
        subgenres: ["Deep House"],
        language: "es",
        instrumental: false,
        analysis_accuracy: 0.89,
        tags: ["mix", "club"],
        dj_set: true
      )
    end

    before do
      attach_image(artist, :avatar)
      attach_image(techno_track, :cover)
      attach_image(ambient_track, :cover)
      attach_image(private_track, :cover)
      attach_image(dj_set_track, :cover)
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
      expect(payload.fetch("tracks").map { |track| track["title"] }).not_to include("Warehouse Broadcast")
      expect(payload.dig("meta", "total_count")).to eq(2)
    end

    it "serves DJ sets separately and filters them by tag" do
      get dj_sets_path(format: :json, tag: "mix")

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body)

      expect(payload.fetch("tracks").map { |track| track["title"] }).to eq(["Warehouse Broadcast"])
      expect(payload.fetch("tracks").first).to include("dj_set" => true)
      expect(payload.dig("facets", "tags")).to include(
        include("value" => "mix", "count" => 1),
        include("value" => "club", "count" => 1)
      )
      expect(payload.fetch("active_filters")).to include("tag" => "mix")
      expect(payload.dig("meta", "total_count")).to eq(1)
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

  describe "GET /tracks/new.json" do
    let(:label) { create(:user, role: :artist, label: true, confirmed_at: Time.current) }

    it "lists only active label artists who belong to the current tenant" do
      active_artist = create(:user, role: :artist, display_name: "Label Artist")
      pending_artist = create(:user, role: :artist)
      create(:user, role: :artist)
      listener = create(:user)
      other_tenant = create(:tenant)
      foreign_artist = Current.set(tenant: other_tenant) { create(:user, role: :artist) }

      create(:connected_account, parent: label, user: active_artist, state: "active")
      create(:connected_account, parent: label, user: pending_artist, state: "pending")
      create(:connected_account, parent: label, user: foreign_artist, state: "active")
      create(:connected_account, parent: label, user: listener, state: "active")
      sign_in label

      get new_track_path(format: :json)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["artists"]).to eq([
        { "id" => active_artist.id, "username" => active_artist.username, "display_name" => "Label Artist" }
      ])
    end

    it "does not expose connected accounts for an ordinary artist" do
      artist = create(:user, role: :artist, confirmed_at: Time.current)
      child = create(:user, role: :artist)
      create(:connected_account, parent: artist, user: child, state: "active")
      sign_in artist

      get new_track_path(format: :json)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["artists"]).to eq([])
    end

    it "requires authentication" do
      get new_track_path(format: :json), as: :json

      expect(response).to redirect_to(new_user_session_path(format: :json))
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

    it "creates DJ sets from the React uploader attributes" do
      blob = audio_blob(filename: "mix.wav")

      sign_in artist

      expect do
        post tracks_path(format: :json),
          params: {
            track_form: {
              step: "info",
              tracks_attributes: [
                {
                  audio: blob.signed_id,
                  title: "Late Night Mix",
                  private: false,
                  dj_set: true,
                  podcast: false
                }
              ]
            }
          },
          as: :json
      end.to change(Track, :count).by(1)

      expect(response).to have_http_status(:ok)

      track = Track.last
      expect(track.title).to eq("Late Night Mix")
      expect(track).to be_dj_set
      expect(track.direct_download).to eq(false)
      expect(track.price).to be_nil
      expect(track.name_your_price).to eq(false)
    end

    context "when a label selects an artist" do
      let(:label) { create(:user, role: :artist, label: true, confirmed_at: Time.current) }
      let(:label_artist) { create(:user, role: :artist, confirmed_at: Time.current) }

      it "assigns every track and the playlist to the artist and associates the label" do
        create(:connected_account, parent: label, user: label_artist, state: "active")
        sign_in label

        expect do
          post_label_upload(artist_id: label_artist.id, make_playlist: true)
        end.to change(Track, :count).by(2)
          .and change(Playlist, :count).by(1)
          .and change(TrackPlaylist, :count).by(2)

        expect(response).to have_http_status(:ok)
        payload = JSON.parse(response.body)
        expect(payload["success"]).to eq(true)
        expect(payload["tracks"].map { |track| track.dig("user", "id") }).to eq([label_artist.id, label_artist.id])
        expect(Track.last(2).map { |track| [track.user_id, track.label_id, track.tenant_id] })
          .to eq([[label_artist.id, label.id, Current.tenant.id]] * 2)
        expect(Playlist.last).to have_attributes(user_id: label_artist.id, label_id: label.id, tenant_id: Current.tenant.id)
      end

      it "keeps uploading under the label account when no artist is selected" do
        sign_in label

        post_label_upload(artist_id: nil)

        expect(JSON.parse(response.body)["success"]).to eq(true)
        expect(Track.last(2).map(&:user_id)).to eq([label.id, label.id])
        expect(Track.last(2).map(&:label_id)).to eq([nil, nil])
      end

      it "rejects an artist from another label without saving tracks or a playlist" do
        other_label = create(:user, role: :artist, label: true)
        create(:connected_account, parent: other_label, user: label_artist, state: "active")
        sign_in label

        expect { post_label_upload(artist_id: label_artist.id, make_playlist: true) }
          .not_to change { [Track.count, Playlist.count, TrackPlaylist.count] }
        expect(JSON.parse(response.body)["success"]).to eq(false)
        expect(JSON.parse(response.body)["errors"]).to include(
          a_string_including(I18n.t("tracks.new.messages.invalid_label_artist"))
        )
      end

      it "rejects a pending connection" do
        create(:connected_account, parent: label, user: label_artist, state: "pending")
        sign_in label

        expect { post_label_upload(artist_id: label_artist.id) }.not_to change(Track, :count)
        expect(JSON.parse(response.body)["success"]).to eq(false)
      end

      it "rejects an artist who only belongs to another tenant" do
        other_tenant = create(:tenant)
        foreign_artist = Current.set(tenant: other_tenant) { create(:user, role: :artist) }
        create(:connected_account, parent: label, user: foreign_artist, state: "active")
        sign_in label

        expect { post_label_upload(artist_id: foreign_artist.id) }.not_to change(Track, :count)
        expect(JSON.parse(response.body)["success"]).to eq(false)
      end

      it "rejects artist assignment from a non-label account" do
        create(:connected_account, parent: artist, user: label_artist, state: "active")
        sign_in artist

        expect { post_label_upload(artist_id: label_artist.id) }.not_to change(Track, :count)
        expect(JSON.parse(response.body)["success"]).to eq(false)
      end

      it "rejects a nonexistent artist" do
        sign_in label

        expect { post_label_upload(artist_id: -1) }.not_to change(Track, :count)
        expect(JSON.parse(response.body)["success"]).to eq(false)
      end
    end

    def post_label_upload(artist_id:, make_playlist: false)
      post tracks_path(format: :json),
        params: {
          track_form: {
            step: "info",
            artist_id: artist_id,
            make_playlist: make_playlist,
            playlist_title: "Label release",
            playlist_type: "album",
            tracks_attributes: [
              { audio: audio_blob(filename: "first.wav").signed_id, title: "First track", private: false },
              { audio: audio_blob(filename: "second.wav").signed_id, title: "Second track", private: false }
            ]
          }
        },
        as: :json
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
      expect(payload["playback_url"]).to include("/rails/active_storage/blobs/redirect/")
      expect(payload["playback_url"]).to include("disposition=inline")
      expect(payload).to include(
        "processing_step" => "queued",
        "processing_progress" => 0
      )
    end

    it "includes the associated label separately from the publishing artist" do
      label = create(:user, role: :artist, label: true, display_name: "Test Label")
      track.update!(label: label)

      get track_path(track, format: :json)

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body).fetch("track")
      expect(payload.dig("user", "id")).to eq(artist.id)
      expect(payload.dig("label", "id")).to eq(label.id)
      expect(payload.dig("label", "username")).to eq(label.username)
      expect(payload.dig("label", "name")).to eq("Test Label")
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
