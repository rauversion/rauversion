require "rails_helper"
require "rake"

RSpec.describe "tracks:analyze_published" do
  before(:all) do
    Rails.application.load_tasks unless Rake::Task.task_defined?("tracks:analyze_published")
  end

  let(:task) { Rake::Task["tracks:analyze_published"] }
  let(:relation) { instance_double(ActiveRecord::Relation) }

  before do
    task.reenable

    allow(Track).to receive(:published).and_return(relation)
    allow(relation).to receive(:where).and_return(relation)
    allow(relation).to receive(:limit).and_return(relation)
  end

  around do |example|
    original_env = ENV.to_h
    %w[DRY_RUN SKIP_ANALYZED LIMIT START_SECONDS DURATION_SECONDS TRACK_ID].each { |key| ENV.delete(key) }
    example.run
  ensure
    ENV.replace(original_env)
  end

  it "analyzes published tracks with audio and skips tracks without analyzable media" do
    track_with_audio = build_task_track(id: 10, title: "Public track", mp3_attached: true)
    track_without_audio = build_task_track(id: 11, title: "Silent track")
    service = instance_double(TrackAudioAnalysisService, call: { genre: "House" })

    allow(relation).to receive(:find_each).and_yield(track_with_audio).and_yield(track_without_audio)
    expect(TrackAudioAnalysisService).to receive(:new).with(
      track: track_with_audio,
      start_seconds: nil,
      duration_seconds: nil,
      persist: true
    ).and_return(service)

    expect do
      task.invoke
    end.to output(
      a_string_including(
        "[OK] track_id=10",
        "[SKIP] track_id=11 reason=no_analyzable_audio",
        "[APPLY] scanned_tracks=2 analyzed_tracks=1 failed_tracks=0 skipped_tracks=1"
      )
    ).to_stdout
  end

  it "supports dry run without calling the analyzer" do
    ENV["DRY_RUN"] = "true"
    track = build_task_track(id: 22, title: "Preview track", mp3_attached: true)

    allow(relation).to receive(:find_each).and_yield(track)
    expect(TrackAudioAnalysisService).not_to receive(:new)

    expect do
      task.invoke
    end.to output(
      a_string_including(
        "[DRY_RUN] track_id=22 title=\"Preview track\"",
        "[DRY_RUN] scanned_tracks=1 analyzed_tracks=0 failed_tracks=0 skipped_tracks=0"
      )
    ).to_stdout
  end

  it "continues processing when one analysis fails" do
    first_track = build_task_track(id: 31, title: "Broken track", mp3_attached: true)
    second_track = build_task_track(id: 32, title: "Good track", mp3_attached: true)
    failing_service = instance_double(TrackAudioAnalysisService)
    successful_service = instance_double(TrackAudioAnalysisService, call: { genre: "Techno" })

    allow(relation).to receive(:find_each).and_yield(first_track).and_yield(second_track)
    allow(TrackAudioAnalysisService).to receive(:new).with(
      track: first_track,
      start_seconds: nil,
      duration_seconds: nil,
      persist: true
    ).and_return(failing_service)
    allow(TrackAudioAnalysisService).to receive(:new).with(
      track: second_track,
      start_seconds: nil,
      duration_seconds: nil,
      persist: true
    ).and_return(successful_service)
    allow(failing_service).to receive(:call).and_raise(TrackAudioAnalysisService::Error, "OpenAI timeout")

    expect do
      task.invoke
    end.to output(
      a_string_including(
        "[ERROR] track_id=31 error=OpenAI timeout",
        "[OK] track_id=32",
        "[APPLY] scanned_tracks=2 analyzed_tracks=1 failed_tracks=1 skipped_tracks=0"
      )
    ).to_stdout
  end

  def build_task_track(id:, title:, mp3_attached: false, audio_attached: false)
    mp3_audio = instance_double("ActiveStorageAttachment", attached?: mp3_attached)
    analyzable_audio_media = instance_double("ActiveStorageAttachment", attached?: audio_attached)

    double(
      "Track",
      id: id,
      title: title,
      mp3_audio: mp3_audio,
      analyzable_audio_media: analyzable_audio_media,
      respond_to?: true
    )
  end
end
