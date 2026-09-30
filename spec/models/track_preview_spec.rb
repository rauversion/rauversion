require "rails_helper"

RSpec.describe "Track previews", type: :model do
  include ActiveJob::TestHelper

  let(:track) { create(:track) }

  def attach_original(duration: 120)
    track.audio.attach(
      io: File.open(Rails.root.join("spec/fixtures/audio.mp3")),
      filename: "original.mp3", content_type: "audio/mpeg",
      metadata: { duration: duration, analyzed: true }
    )
  end

  def attach_public_mp3
    track.mp3_audio.attach(
      io: StringIO.new("public mp3"), filename: "public.mp3", content_type: "audio/mpeg",
      metadata: { playback_signature: track.playback_signature, duration: 15, analyzed: true }
    )
  end

  before { attach_original }

  it "keeps the original but removes the old public MP3 and waveform when enabling a preview" do
    attach_public_mp3
    track.update!(peaks: [0.5, 1.0], state: "processed")
    old_blob = track.mp3_audio.blob
    original_blob = track.audio.blob

    expect do
      track.update!(preview_enabled: true, preview_start_seconds: 20, preview_duration_seconds: 15)
    end.to have_enqueued_job(TrackProcessorJob).with(track.id)
      .and have_enqueued_job(ActiveStorage::PurgeJob).with(old_blob)

    expect(track.reload.mp3_audio).not_to be_attached
    expect(track.playback_media).to be_nil
    expect(track.peaks).to eq([])
    expect(track.state).to eq("pending")
    expect(track.downloadable_media.blob).to eq(original_blob)
    expect(track.original_duration).to eq(120)
    expect(track.duration).to be_nil
  end

  it "requires explicit confirmation before disabling an existing preview" do
    track.update!(preview_enabled: true)
    attach_public_mp3
    blob = track.mp3_audio.blob

    expect(track.update(preview_enabled: false)).to eq(false)
    expect(track.errors.of_kind?(:preview_enabled, :confirmation_required)).to eq(true)
    expect(track.reload.preview_enabled?).to eq(true)
    expect(track.mp3_audio.blob).to eq(blob)

    expect do
      track.update!(preview_enabled: false, confirm_full_length: true)
    end.to have_enqueued_job(TrackProcessorJob).with(track.id)
    expect(track.reload.preview_enabled?).to eq(false)
    expect(track.mp3_audio).not_to be_attached
  end

  it "does not regenerate audio for unrelated edits or unchanged preview settings" do
    track.update!(preview_enabled: true, preview_start_seconds: 20, preview_duration_seconds: 15)
    attach_public_mp3
    blob = track.mp3_audio.blob

    expect do
      track.update!(title: "New title", preview_enabled: true, preview_start_seconds: 20, preview_duration_seconds: 15)
    end.not_to have_enqueued_job(TrackProcessorJob)
    expect(track.reload.mp3_audio.blob).to eq(blob)
  end

  it "invalidates the preview when the original is replaced" do
    track.update!(preview_enabled: true)
    attach_public_mp3

    expect { attach_original }.to have_enqueued_job(TrackProcessorJob).with(track.id)
    expect(track.reload.mp3_audio).not_to be_attached
  end

  it "rejects negative, empty, non-finite and out-of-bounds preview windows" do
    [
      { preview_start_seconds: -1 },
      { preview_duration_seconds: 0 },
      { preview_duration_seconds: nil },
      { preview_duration_seconds: Float::INFINITY },
      { preview_start_seconds: 110, preview_duration_seconds: 15 }
    ].each do |attributes|
      track.reload.assign_attributes({ preview_enabled: true }.merge(attributes))
      expect(track).not_to be_valid
    end
  end

  it "rejects previews for video tracks and hides video playback defensively" do
    track.video.attach(io: StringIO.new("video"), filename: "clip.mp4", content_type: "video/mp4")
    track.preview_enabled = true

    expect(track).not_to be_valid
    expect(track.errors.of_kind?(:preview_enabled, :audio_only)).to eq(true)
    expect(track.video_playback_media).to be_nil
  end

  it "never falls back to the original or exposes an unsigned full MP3 as a preview" do
    expect(track.playback_media).to be_nil
    track.update!(preview_enabled: true)
    track.mp3_audio.attach(io: StringIO.new("legacy full mp3"), filename: "legacy.mp3", content_type: "audio/mpeg")

    expect(track.playback_media).to be_nil
    payload = TrackProcessing::Serializer.new(track).as_json
    expect(payload.values_at(:audio_url, :mp3_url, :playback_url)).to eq([nil, nil, nil])
  end

  it "uses the MP3 duration and waveform, retaining the original duration separately" do
    track.update!(preview_enabled: true, preview_duration_seconds: 15)
    attach_public_mp3
    expect(track.duration).to eq(15)
    expect(track.original_duration).to eq(120)
    expect(PeaksGenerator).to receive(:new) do |path|
      expect(File.binread(path)).to eq("public mp3")
      double(run: [0.2, 1.0])
    end
    expect(track.process_audio_peaks).to eq([0.2, 1.0])
  end

  it "discards a conversion if the artist changes the preview while it runs" do
    track.update!(preview_enabled: true, preview_duration_seconds: 15)
    dir = Dir.mktmpdir("stale-preview")
    path = File.join(dir, "preview.mp3")
    File.binwrite(path, "old preview")
    converter = double
    allow(Mp3Converter).to receive(:new).and_return(converter)
    allow(converter).to receive(:run) do
      Track.find(track.id).update!(preview_start_seconds: 30)
      path
    end

    expect { track.reprocess! }.to raise_error(TrackPreview::StaleProcessing)
    expect(track.reload.mp3_audio).not_to be_attached
    expect(track.preview_start_seconds).to eq(30)
    expect(Dir.exist?(dir)).to eq(false)
    expect(ActiveStorage::Blob.where.not(id: track.audio.blob.id)).to be_empty
  ensure
    FileUtils.remove_entry(dir) if dir && Dir.exist?(dir)
  end

  it "discards a conversion for an original that has been replaced" do
    dir = Dir.mktmpdir("stale-source")
    path = File.join(dir, "full.mp3")
    File.binwrite(path, "old full audio")
    converter = double
    allow(Mp3Converter).to receive(:new).and_return(converter)
    allow(converter).to receive(:run) do
      replacement = Track.find(track.id)
      replacement.audio.attach(io: StringIO.new("new original"), filename: "new.wav", content_type: "audio/wav")
      path
    end

    expect { track.reprocess! }.to raise_error(TrackPreview::StaleProcessing)
    expect(track.reload.mp3_audio).not_to be_attached
  ensure
    FileUtils.remove_entry(dir) if dir && Dir.exist?(dir)
  end

  it "removes the previous full-length MP3 from storage through the purge job" do
    attach_public_mp3
    previous_blob = track.mp3_audio.blob
    storage_key = previous_blob.key
    service = previous_blob.service

    perform_enqueued_jobs(only: ActiveStorage::PurgeJob) do
      track.update!(preview_enabled: true)
    end

    expect(ActiveStorage::Blob.exists?(previous_blob.id)).to eq(false)
    expect(service.exist?(storage_key)).to eq(false)
    expect(track.audio).to be_attached
  end

  it "processes a real excerpt and regenerates the full recording after confirmation" do
    track.audio.blob.update!(metadata: { duration: 0.417938, analyzed: true })
    track.update!(preview_enabled: true, preview_start_seconds: 0.1, preview_duration_seconds: 0.2)

    track.reprocess!
    expect(track.reload).to be_processed
    expect(track.duration).to be_within(0.06).of(0.2)
    expect(track.peaks).not_to be_empty
    expect(track.playback_media).to eq(track.mp3_audio)
    preview_duration = track.duration

    track.update!(preview_enabled: false, confirm_full_length: true)
    expect(track.playback_media).to be_nil
    track.reprocess!

    expect(track.reload).to be_processed
    expect(track.duration).to be > preview_duration
    expect(track.duration).to be_within(0.06).of(0.417938)
    expect(track.downloadable_media).to eq(track.audio)
  end
end
