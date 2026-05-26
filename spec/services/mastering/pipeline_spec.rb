require "rails_helper"

RSpec.describe Mastering::Pipeline do
  let(:user) { create(:user) }
  let(:track) { create(:track, user: user, title: "Pipeline Track") }
  let(:track_master) { create(:track_master, track: track, target_profile: "demo_balanced") }
  let(:output_dir) { Dir.mktmpdir("mastering-pipeline-spec") }
  let(:output_path) { File.join(output_dir, "render.wav") }
  let(:analysis_before) do
    {
      duration_sec: 1.0,
      sample_rate_hz: 44_100,
      channels: 2,
      integrated_lufs: -12.0,
      true_peak_dbfs: -2.0
    }
  end
  let(:analysis_after) { analysis_before.merge(integrated_lufs: -11.5, true_peak_dbfs: -1.0) }
  let(:recipe) do
    {
      diagnosis: {
        summary_es: "OK",
        risk_level: "low",
        already_mastered: false,
        main_issues: []
      },
      target: {
        profile: "demo_balanced",
        target_lufs: -11.5,
        true_peak_ceiling_db: -1.0
      },
      processing_chain: [],
      export: {
        format: "wav",
        bit_depth: 24,
        sample_rate_hz: 44_100,
        dither: true
      },
      artist_message_es: "Listo",
      warnings_es: []
    }
  end

  before do
    track.audio.attach(
      io: StringIO.new("fake-audio"),
      filename: "source.wav",
      content_type: "audio/wav"
    )
    File.binwrite(output_path, "fake-rendered-wav")

    analyzer_before = instance_double(Mastering::AudioAnalyzer, call: analysis_before)
    analyzer_after = instance_double(Mastering::AudioAnalyzer, call: analysis_after)
    allow(Mastering::AudioAnalyzer).to receive(:new).and_return(analyzer_before, analyzer_after)
    allow(Mastering::RecipeGenerator).to receive(:new).and_return(
      instance_double(Mastering::RecipeGenerator, call: recipe)
    )
    allow(Mastering::AudioProcessor).to receive(:new).and_return(
      instance_double(Mastering::AudioProcessor, call: output_path)
    )
    allow(ActionCable.server).to receive(:broadcast)
  end

  after do
    FileUtils.remove_entry(output_dir) if Dir.exist?(output_dir)
  end

  it "analyzes, renders, attaches the master and persists report data" do
    described_class.new(track_master: track_master).call

    track_master.reload

    expect(track_master.state).to eq("completed")
    expect(track_master.audio).to be_attached
    expect(track_master.recipe).to include("target" => include("profile" => "demo_balanced"))
    expect(track_master.analysis_before).to include("integrated_lufs" => -12.0)
    expect(track_master.analysis_after).to include("true_peak_dbfs" => -1.0)
    expect(track_master.completed_at).to be_present
    expect(ActionCable.server).to have_received(:broadcast).with(
      "mastering_#{track_master.id}",
      hash_including(
        type: "mastering_progress",
        event: "completed",
        progress: 100,
        track_master: hash_including(state: "completed", ready: true)
      )
    )
  end
end
