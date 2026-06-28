require "rails_helper"

RSpec.describe Mastering::FeedbackParameterizer do
  it "turns an extreme high-frequency request into a safe audible high-shelf cut and low-pass" do
    result = described_class.new(
      feedback: "corta los agudos al maximo",
      reference_notes: "",
      analysis: {
        integrated_lufs: -10.5,
        true_peak_dbfs: -1.2
      },
      target_profile: "demo_balanced"
    ).call

    high_cut = result.fetch(:eq_bands).find { |band| band[:filter] == "high_shelf" }

    expect(result[:source]).to eq("rules")
    expect(high_cut).to include(
      frequency_hz: 8500,
      gain_db: -2.5,
      q: 0.7
    )
    expect(result[:lowpass_filter]).to include(
      enabled: true,
      frequency_hz: 12_000,
      slope_db_per_oct: 12
    )
    expect(result.fetch(:warnings_es)).to include(match(/limito a un recorte seguro/))
  end

  it "uses the OpenAI tool result when a client is injected and clamps unsafe values" do
    client = instance_double(OpenAI::Client)

    allow(client).to receive(:chat).and_return(
      {
        "choices" => [
          {
            "message" => {
              "tool_calls" => [
                {
                  "function" => {
                    "name" => "submit_mastering_feedback_parameters",
                    "arguments" => {
                      summary_es: "Recorte fuerte de brillo, limitado para preservar el mix.",
                      eq_bands: [
                        {
                          filter: "high_shelf",
                          frequency_hz: 22_000,
                          gain_db: -9.0,
                          q: 8.0,
                          reason_es: "Oscurecer agudos."
                        }
                      ],
                      lowpass_filter: {
                        enabled: true,
                        frequency_hz: 6000,
                        slope_db_per_oct: 36,
                        reason_es: "Low-pass fuerte."
                      },
                      saturation: {
                        enabled: true,
                        drive_db: 4.0,
                        mix_percent: 80,
                        reason_es: "Densidad."
                      },
                      compression: {
                        enabled: true,
                        ratio: 3.0,
                        mix_percent: 80,
                        reason_es: "Control."
                      },
                      warnings_es: ["Recorte extremo limitado."]
                    }.to_json
                  }
                }
              ]
            }
          }
        ]
      }
    )

    result = described_class.new(
      feedback: "corta los agudos al maximo",
      reference_notes: "",
      analysis: {},
      target_profile: "club_loud",
      client: client
    ).call

    expect(result[:source]).to eq("ai_tool")
    expect(result.fetch(:eq_bands).first).to include(
      frequency_hz: 18_000,
      gain_db: -3.0,
      q: 3.0
    )
    expect(result.dig(:saturation, :drive_db)).to eq(1.0)
    expect(result.dig(:saturation, :mix_percent)).to eq(20)
    expect(result.dig(:compression, :ratio)).to eq(1.6)
    expect(result.dig(:compression, :mix_percent)).to eq(45)
    expect(result[:lowpass_filter]).to include(
      enabled: true,
      frequency_hz: 8_000,
      slope_db_per_oct: 12
    )
    expect(client).to have_received(:chat).with(
      parameters: hash_including(
        tools: [hash_including(type: "function")],
        tool_choice: hash_including(function: { name: "submit_mastering_feedback_parameters" })
      )
    )
  end

  it "forces a safe low-pass for extreme high-cut requests even when the AI omits it" do
    client = instance_double(OpenAI::Client)

    allow(client).to receive(:chat).and_return(
      {
        "choices" => [
          {
            "message" => {
              "tool_calls" => [
                {
                  "function" => {
                    "name" => "submit_mastering_feedback_parameters",
                    "arguments" => {
                      summary_es: "Recorte de agudos.",
                      eq_bands: [
                        {
                          filter: "high_shelf",
                          frequency_hz: 8000,
                          gain_db: -3,
                          q: 0.5,
                          reason_es: "Bajar brillo."
                        }
                      ],
                      lowpass_filter: {
                        enabled: false,
                        frequency_hz: 18_000,
                        slope_db_per_oct: 6,
                        reason_es: "Sin low-pass."
                      },
                      saturation: {
                        enabled: false,
                        drive_db: 0,
                        mix_percent: 0,
                        reason_es: "No aplica."
                      },
                      compression: {
                        enabled: false,
                        ratio: 1.3,
                        mix_percent: 0,
                        reason_es: "No aplica."
                      },
                      warnings_es: []
                    }.to_json
                  }
                }
              ]
            }
          }
        ]
      }
    )

    result = described_class.new(
      feedback: "corta los agudos al maximo",
      reference_notes: "",
      analysis: {},
      target_profile: "club_loud",
      client: client
    ).call

    expect(result[:lowpass_filter]).to include(
      enabled: true,
      frequency_hz: 12_000,
      slope_db_per_oct: 12
    )
  end
end
