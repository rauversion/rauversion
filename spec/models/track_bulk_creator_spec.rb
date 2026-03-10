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
end
