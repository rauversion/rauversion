require "rails_helper"

RSpec.describe Mastering::PolicyAdvisor do
  let(:profile) { Mastering::TargetProfiles.fetch("club_loud") }

  it "returns the profile policy without AI by default in test" do
    policy = described_class.new(
      profile: profile,
      analysis: { integrated_lufs: -22.2, true_peak_dbfs: -5.4 },
      feedback: "menos bombeo",
      reference_notes: ""
    ).call

    expect(policy).to include(
      source: "profile",
      limiter_max_gain_reduction_db: 9.0,
      loudness_correction_limit_db: 4.0,
      max_loudness_correction_passes: 3,
      minimum_crest_factor_db: 10.0
    )
  end

  it "clamps AI policy values to the selected profile limits" do
    client = instance_double(OpenAI::Client)
    allow(client).to receive(:chat).and_return(
      {
        "choices" => [
          {
            "message" => {
              "tool_calls" => [
                {
                  "function" => {
                    "name" => "submit_mastering_policy",
                    "arguments" => {
                      summary_es: "Priorizar menos bombeo.",
                      limiter_max_gain_reduction_db: 20,
                      loudness_correction_limit_db: 8,
                      max_loudness_correction_passes: 9,
                      minimum_crest_factor_db: 12,
                      max_positive_gain_db: 40,
                      loud_source_gain_cap_db: 6,
                      true_peak_safety_margin_db: 0.1,
                      warnings_es: ["Se prioriza dinamica sobre loudness."]
                    }.to_json
                  }
                }
              ]
            }
          }
        ]
      }
    )

    policy = described_class.new(
      profile: profile,
      analysis: { integrated_lufs: -22.2, true_peak_dbfs: -5.4 },
      feedback: "menos bombeo",
      reference_notes: "",
      client: client
    ).call

    expect(policy).to include(
      source: "ai_tool",
      limiter_max_gain_reduction_db: 9.0,
      loudness_correction_limit_db: 4.0,
      max_loudness_correction_passes: 3,
      minimum_crest_factor_db: 12.0,
      max_positive_gain_db: 16.0,
      loud_source_gain_cap_db: 1.5,
      true_peak_safety_margin_db: 0.3
    )
  end
end
