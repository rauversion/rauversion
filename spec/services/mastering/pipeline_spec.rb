require "rails_helper"

RSpec.describe Mastering::Pipeline do
  let(:user) { create(:user) }
  let(:track) { create(:track, user: user, title: "Pipeline Track") }
  let(:track_master) { create(:track_master, track: track, target_profile: "demo_balanced") }
  let(:output_dir) { Dir.mktmpdir("mastering-pipeline-spec") }
  let(:output_path) { File.join(output_dir, "render.wav") }
  let(:corrected_output_dir) { Dir.mktmpdir("mastering-pipeline-corrected-spec") }
  let(:corrected_output_path) { File.join(corrected_output_dir, "render.wav") }
  let(:second_corrected_output_dir) { Dir.mktmpdir("mastering-pipeline-corrected-2-spec") }
  let(:second_corrected_output_path) { File.join(second_corrected_output_dir, "render.wav") }
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
    File.binwrite(corrected_output_path, "fake-corrected-rendered-wav")
    File.binwrite(second_corrected_output_path, "fake-corrected-rendered-wav-2")

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
    FileUtils.remove_entry(corrected_output_dir) if Dir.exist?(corrected_output_dir)
    FileUtils.remove_entry(second_corrected_output_dir) if Dir.exist?(second_corrected_output_dir)
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

  it "runs correction passes until the master is close to the target loudness" do
    club_master = create(:track_master, track: track, target_profile: "club_loud")
    club_recipe = recipe.merge(
      target: {
        profile: "club_loud",
        target_lufs: -9.0,
        true_peak_ceiling_db: -0.7
      },
      processing_chain: [
        {
          type: "limiter",
          enabled: true,
          ceiling_db: -0.7,
          target_lufs: -9.0,
          max_gain_reduction_db: 9.0
        }
      ]
    )
    first_after = analysis_after.merge(integrated_lufs: -11.2, true_peak_dbfs: -1.1, clipping_detected: false)
    corrected_after = analysis_after.merge(integrated_lufs: -10.1, true_peak_dbfs: -1.1, clipping_detected: false)
    second_corrected_after = analysis_after.merge(integrated_lufs: -9.2, true_peak_dbfs: -0.9, clipping_detected: false)

    analyzer_before = instance_double(Mastering::AudioAnalyzer, call: analysis_before.merge(integrated_lufs: -22.2, true_peak_dbfs: -5.4))
    analyzer_first_after = instance_double(Mastering::AudioAnalyzer, call: first_after)
    analyzer_corrected_after = instance_double(Mastering::AudioAnalyzer, call: corrected_after)
    analyzer_second_corrected_after = instance_double(Mastering::AudioAnalyzer, call: second_corrected_after)
    allow(Mastering::AudioAnalyzer).to receive(:new).and_return(analyzer_before, analyzer_first_after, analyzer_corrected_after, analyzer_second_corrected_after)
    allow(Mastering::RecipeGenerator).to receive(:new).and_return(
      instance_double(Mastering::RecipeGenerator, call: club_recipe)
    )
    first_processor = instance_double(Mastering::AudioProcessor, call: output_path)
    corrected_processor = instance_double(Mastering::AudioProcessor, call: corrected_output_path)
    second_corrected_processor = instance_double(Mastering::AudioProcessor, call: second_corrected_output_path)
    allow(Mastering::AudioProcessor).to receive(:new).and_return(first_processor, corrected_processor, second_corrected_processor)

    described_class.new(track_master: club_master).call

    club_master.reload

    expect(club_master.analysis_after).to include("integrated_lufs" => -9.2)
    expect(club_master.recipe).to include(
      "render_adjustments" => include(
        "loudness_offset_db" => 3.3,
        "correction_passes" => 2
      )
    )
    expect(Mastering::AudioProcessor).to have_received(:new).with(
      hash_including(recipe: hash_including(render_adjustments: hash_including(loudness_offset_db: 2.2)))
    )
    expect(Mastering::AudioProcessor).to have_received(:new).with(
      hash_including(recipe: hash_including(render_adjustments: hash_including(loudness_offset_db: 3.3)))
    )
  end
end
