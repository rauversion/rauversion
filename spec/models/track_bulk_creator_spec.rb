require "rails_helper"

RSpec.describe TrackBulkCreator, type: :model do
  let(:user) { create(:user, confirmed_at: Time.current) }

  describe "#tracks" do
    it "attaches video uploads to the video attachment" do
      blob = ActiveStorage::Blob.create_and_upload!(
        io: StringIO.new("fake-video"),
        filename: "clip.mp4",
        content_type: "video/mp4"
      )

      creator = described_class.new(
        user: user,
        tracks_attributes: [
          {
            audio: blob.signed_id,
            title: "Video track",
            private: false
          }
        ]
      )

      track = creator.tracks.first

      expect(track.video).to be_attached
      expect(track.audio).not_to be_attached
    end

    it "keeps audio uploads on the audio attachment" do
      blob = ActiveStorage::Blob.create_and_upload!(
        io: StringIO.new("fake-audio"),
        filename: "song.wav",
        content_type: "audio/wav"
      )

      creator = described_class.new(
        user: user,
        tracks_attributes: [
          {
            audio: blob.signed_id,
            title: "Audio track",
            private: false
          }
        ]
      )

      track = creator.tracks.first

      expect(track.audio).to be_attached
      expect(track.video).not_to be_attached
    end
  end

  describe "#save" do
    it "creates a playlist with the uploaded tracks when requested" do
      first_blob = audio_blob(filename: "first.wav")
      second_blob = audio_blob(filename: "second.wav")

      creator = described_class.new(
        user: user,
        make_playlist: true,
        playlist_title: "Upload session",
        playlist_type: "album",
        playlist_private: true,
        tracks_attributes: [
          { audio: first_blob.signed_id, title: "First track", private: false },
          { audio: second_blob.signed_id, title: "Second track", private: false }
        ]
      )

      expect { expect(creator.save).to eq(true) }
        .to change(Playlist, :count).by(1)
        .and change(Track, :count).by(2)
        .and change(TrackPlaylist, :count).by(2)

      playlist = creator.playlist
      expect(playlist.title).to eq("Upload session")
      expect(playlist.private).to eq(true)
      expect(playlist.playlist_type).to eq("album")
      expect(playlist.tracks.order("track_playlists.position").pluck(:title)).to eq(
        ["First track", "Second track"]
      )
    end

    it "requires a playlist title when playlist creation is requested" do
      creator = described_class.new(
        user: user,
        make_playlist: true,
        playlist_title: "",
        tracks_attributes: [
          { audio: audio_blob(filename: "first.wav").signed_id, title: "First track", private: false },
          { audio: audio_blob(filename: "second.wav").signed_id, title: "Second track", private: false }
        ]
      )

      expect { expect(creator.save).to eq(false) }
        .not_to change(Playlist, :count)
      expect(creator.errors[:playlist_title]).to include("can't be blank")
    end

    it "rejects unsupported playlist types" do
      creator = described_class.new(
        user: user,
        make_playlist: true,
        playlist_title: "Upload session",
        playlist_type: "mixtape",
        tracks_attributes: [
          { audio: audio_blob(filename: "first.wav").signed_id, title: "First track", private: false },
          { audio: audio_blob(filename: "second.wav").signed_id, title: "Second track", private: false }
        ]
      )

      expect { expect(creator.save).to eq(false) }
        .not_to change(Playlist, :count)
      expect(creator.errors[:playlist_type]).to include("is not included in the list")
    end
  end

  def audio_blob(filename:)
    ActiveStorage::Blob.create_and_upload!(
      io: StringIO.new("fake-audio"),
      filename: filename,
      content_type: "audio/wav"
    )
  end
end
