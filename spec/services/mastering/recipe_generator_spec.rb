require "rails_helper"

RSpec.describe Mastering::RecipeGenerator do
  let(:track) { build(:track, title: "Warehouse Test") }

  it "keeps already-loud material conservative" do
    recipe = described_class.new(
      track: track,
      analysis: {
        integrated_lufs: -8.4,
        true_peak_dbfs: -0.3,
        clipping_detected: false,
        crest_factor_db: 8.1
      },
      target_profile: "club_loud",
      feedback: "mantener pegada, limpiar subgrave",
      reference_notes: ""
    ).call

    expect(recipe.dig(:diagnosis, :already_mastered)).to eq(true)
    expect(recipe.dig(:target, :profile)).to eq("club_loud")
    expect(recipe.dig(:target, :true_peak_ceiling_db)).to eq(-0.7)

    limiter = recipe.fetch(:processing_chain).find { |stage| stage[:type] == "limiter" }
    compressor = recipe.fetch(:processing_chain).find { |stage| stage[:type] == "bus_compressor" }
    eq = recipe.fetch(:processing_chain).find { |stage| stage[:type] == "eq" }

    expect(limiter[:max_gain_reduction_db]).to eq(1.0)
    expect(compressor[:enabled]).to eq(false)
    expect(eq[:bands]).to include(include(filter: "low_shelf", gain_db: -0.8))
    expect(recipe.fetch(:warnings_es)).to include(match(/loudness/))
  end

  it "uses vinyl settings without final limiting" do
    recipe = described_class.new(
      track: track,
      analysis: {
        integrated_lufs: -14.5,
        true_peak_dbfs: -4.0,
        crest_factor_db: 11.0
      },
      target_profile: "vinyl_premaster"
    ).call

    highpass = recipe.fetch(:processing_chain).find { |stage| stage[:type] == "highpass_filter" }
    limiter = recipe.fetch(:processing_chain).find { |stage| stage[:type] == "limiter" }

    expect(recipe.dig(:target, :target_lufs)).to eq(-15.0)
    expect(highpass[:frequency_hz]).to eq(30)
    expect(limiter[:enabled]).to eq(false)
  end

  it "parameterizes explicit high-frequency feedback into the applied eq chain" do
    recipe = described_class.new(
      track: track,
      analysis: {
        integrated_lufs: -11.5,
        true_peak_dbfs: -1.4,
        crest_factor_db: 10.0
      },
      target_profile: "demo_balanced",
      feedback: "corta los agudos al maximo"
    ).call

    eq = recipe.fetch(:processing_chain).find { |stage| stage[:type] == "eq" }
    lowpass = recipe.fetch(:processing_chain).find { |stage| stage[:type] == "lowpass_filter" }

    expect(recipe.dig(:feedback_interpretation, :source)).to eq("rules")
    expect(eq[:enabled]).to eq(true)
    expect(eq[:bands]).to include(
      include(
        filter: "high_shelf",
        frequency_hz: 8500,
        gain_db: -2.5,
        q: 0.7
      )
    )
    expect(lowpass).to include(
      enabled: true,
      frequency_hz: 12_000,
      slope_db_per_oct: 12
    )
    expect(recipe.fetch(:warnings_es)).to include(match(/recorte seguro/))
  end
end
