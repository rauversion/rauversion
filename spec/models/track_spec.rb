require "rails_helper"

RSpec.describe Track, type: :model do
  it { should belong_to(:user) }
  it { should have_many(:track_comments) }
  it { should have_many(:track_playlists) }
  it { should have_many(:playlists).through(:track_playlists) }
  it { should have_many(:listening_events) }
  it { should have_many(:reposts) }
  it { should have_many(:purchased_items) }
  it { should have_many(:likes) }
  it { should have_many(:comments) }

  it { should have_one_attached(:cover) }
  it { should have_one_attached(:audio) }
  it { should have_one_attached(:video) }
  it { should have_one_attached(:mp3_audio) }
  it { should have_one_attached(:zip) }

  let!(:user) {
    FactoryBot.create(:user, username: "user", role: "user")
  }

  let(:audio_file) { fixture_file_upload("spec/fixtures/audio.mp3", "audio/mpeg") }

  describe "scopes" do
    before do
      @track1 = FactoryBot.create(:track, private: false, user: user, created_at: 1.day.ago)
      @track2 = FactoryBot.create(:track, private: true, user: user, created_at: 2.days.ago)
      @track3 = FactoryBot.create(:track, private: false, user: user, created_at: 3.days.ago)
    end

    describe ".published" do
      it "returns only published tracks" do
        expect(Track.published).to contain_exactly(@track1, @track3)
      end
    end

    describe ".latests" do
      it "returns tracks in descending order of creation" do
        expect(Track.latests.ids).to eq([@track3.id, @track2.id, @track1.id])
      end
    end
  end

  describe ".series_by_month" do
    let(:user) { FactoryBot.create(:user) }
    let(:track) { FactoryBot.create(:track, user: user) }

    before do
      # Create listening events for the track
      FactoryBot.create(:listening_event, resource_profile_id: user.id, track: track, created_at: 2.months.ago)
      FactoryBot.create(:listening_event, resource_profile_id: user.id, track: track, created_at: 1.month.ago)
      FactoryBot.create(:listening_event, resource_profile_id: user.id, track: track, created_at: Time.zone.now)
    end

    it "returns the correct count of listening events grouped by month" do
      result = Track.series_by_month(user.id)
      expect(result.find { |h| h[:day] == 2.months.ago.beginning_of_month.to_date }[:count]).to eq(1)
      expect(result.find { |h| h[:day] == 1.month.ago.beginning_of_month.to_date }[:count]).to eq(1)
      expect(result.find { |h| h[:day] == Time.zone.now.beginning_of_month.to_date }[:count]).to eq(1)
    end
  end

  describe ".top_countries" do
    let(:user) { FactoryBot.create(:user) }
    let(:track) { FactoryBot.create(:track, user: user) }

    before do
      # Create listening events for the track
      FactoryBot.create(:listening_event, resource_profile_id: user.id, track: track, country: "USA")
      FactoryBot.create(:listening_event, resource_profile_id: user.id, track: track, country: "USA")
      FactoryBot.create(:listening_event, resource_profile_id: user.id, track: track, country: "Canada")
    end

    it "returns the correct count of listening events grouped by country" do
      result = Track.top_countries(user.id)
      expect(result.find { |h| h.country == "USA" }.count).to eq(2)
      expect(result.find { |h| h.country == "Canada" }.count).to eq(1)
    end
  end

  describe ".top_listeners" do
    let(:profile) { FactoryBot.create(:user) }
    let(:user1) { FactoryBot.create(:user) }
    let(:user2) { FactoryBot.create(:user) }
    let(:user3) { FactoryBot.create(:user) }

    before do
      FactoryBot.create_list(:listening_event, 5, resource_profile_id: profile.id, user: user1)
      FactoryBot.create_list(:listening_event, 3, resource_profile_id: profile.id, user: user2)
      FactoryBot.create_list(:listening_event, 2, resource_profile_id: profile.id, user: user3)
    end

    it "returns the correct count of listening events grouped by user" do
      result = Track.top_listeners(profile.id)
      expect(result.find { |h| h.id == user1.id }.count).to eq(5)
      expect(result.find { |h| h.id == user2.id }.count).to eq(3)
      expect(result.find { |h| h.id == user3.id }.count).to eq(2)
    end
  end

  describe "state" do
    it "pending" do
      @track = FactoryBot.create(:track, private: false, user: user, created_at: 1.day.ago)
      expect(@track).to be_pending
    end
  end

  describe "tags" do
    it "create with tags" do
      @track = FactoryBot.create(:track, user: user, tags: ["Ambient", "Techno"])
      expect(@track.tags).to be == ["ambient", "techno"]
      expect(Track.get_tracks_by_tag("Ambient")).to be_any
      expect(Track.get_tracks_by_tag("ambient")).to be_any
    end
  end

  describe "audio" do
    xit "can be created with an audio file" do
      audio = Rack::Test::UploadedFile.new(Rails.root.join("spec", "fixtures", "audio.mp3"), "audio/mp3")
      track = FactoryBot.create(:track, audio: audio, user: user)
      expect_any_instance_of(Track).to receive(:reprocess_async)
      expect(track).to be_persisted
      expect(track.audio).to be_persisted
    end
  end

  describe "#process_audio_peaks" do
    let(:peaks_processor) { instance_double(PeaksGenerator) }
    let(:track) { FactoryBot.create(:track, user: user) }

    before do
      track.audio.attach(audio_file)
      allow(PeaksGenerator).to receive(:new).and_return(peaks_processor)
      allow(peaks_processor).to receive(:run).and_return([1, 2, 3, 4, 5])
    end

    it "processes the audio peaks" do
      expect(PeaksGenerator).to receive(:new).with(kind_of(String)) # we expect a file path here
      expect(peaks_processor).to receive(:run)

      peaks = track.process_audio_peaks

      expect(peaks).to eq([1, 2, 3, 4, 5])
    end

    it "processes the audio peaks update" do
      track.update(peaks: [1,4,4,4])
      expect(track.peaks).to be == [1,4,4,4]
      track.update(peaks: [1,2,3,4])
      expect(track.peaks).to be == [1,2,3,4]
    end
  end

  describe "#process_mp3" do
    let(:audio_file) { fixture_file_upload("spec/fixtures/audio.mp3", "audio/mpeg") }
    let(:track) { FactoryBot.create(:track, user: user) }

    before do
      track.audio.attach(audio_file)
    end

    describe "#update_mp3" do
      let(:mp3_converter) { instance_double(Mp3Converter) }
      let(:mp3_output_dir) { Dir.mktmpdir("track-spec-mp3") }
      let(:mp3_output_path) { File.join(mp3_output_dir, "converted.mp3") }

      before do
        File.binwrite(mp3_output_path, "fake-mp3")
        allow(Mp3Converter).to receive(:new).and_return(mp3_converter)
        allow(mp3_converter).to receive(:run).and_return(mp3_output_path)
      end

      after do
        FileUtils.remove_entry(mp3_output_dir) if Dir.exist?(mp3_output_dir)
      end

      it "converts the audio file to mp3" do
        expect(Mp3Converter).to receive(:new).with(kind_of(String)) # we expect an ActiveStorage attachment here
        expect(mp3_converter).to receive(:run)

        track.update_mp3

        expect(track.mp3_audio).to be_attached
      end
    end
  end

  describe "#reprocess! with video" do
    let(:track) { FactoryBot.create(:track, user: user) }
    let(:wav_converter) { instance_double(WavConverter, run: wav_output_path) }
    let(:mp3_converter) { instance_double(Mp3Converter, run: mp3_output_path) }
    let(:peaks_processor) { instance_double(PeaksGenerator, run: [0.1, 0.3, 0.6]) }
    let(:wav_output_dir) { Dir.mktmpdir("track-spec-wav") }
    let(:mp3_output_dir) { Dir.mktmpdir("track-spec-video-mp3") }
    let(:wav_output_path) { File.join(wav_output_dir, "converted.wav") }
    let(:mp3_output_path) { File.join(mp3_output_dir, "converted.mp3") }

    before do
      track.video.attach(
        io: StringIO.new("fake-video"),
        filename: "clip.mp4",
        content_type: "video/mp4"
      )

      File.binwrite(wav_output_path, "fake-wav")
      File.binwrite(mp3_output_path, "fake-mp3")

      allow(WavConverter).to receive(:new).and_return(wav_converter)
      allow(Mp3Converter).to receive(:new).and_return(mp3_converter)
      allow(PeaksGenerator).to receive(:new).and_return(peaks_processor)
    end

    after do
      FileUtils.remove_entry(wav_output_dir) if Dir.exist?(wav_output_dir)
      FileUtils.remove_entry(mp3_output_dir) if Dir.exist?(mp3_output_dir)
    end

    it "extracts wav and mp3 assets and marks the track as processed" do
      track.reprocess!

      expect(track.audio).to be_attached
      expect(track.mp3_audio).to be_attached
      expect(track.state).to eq("processed")
      expect(track.peaks).to eq([0.1, 0.3, 0.6])
      expect(track).to be_has_video
      expect(track.playback_media).to eq(track.mp3_audio)
      expect(track.downloadable_media).to eq(track.audio)
      expect(track.duration).to be_nil
    end
  end

  describe "#duration" do
    let(:track) { FactoryBot.create(:track, user: user) }

    it "reads duration from the playback media metadata when present" do
      playback_media = instance_double("PlaybackMedia", attached?: true, metadata: { "duration" => 123.45 })
      allow(track).to receive(:playback_media).and_return(playback_media)

      expect(track.duration).to eq(123.45)
    end
  end
end
