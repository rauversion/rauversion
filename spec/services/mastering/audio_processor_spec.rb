require "rails_helper"

RSpec.describe Mastering::AudioProcessor do
  let(:output_dir) { Dir.mktmpdir("audio-processor-spec") }
  let(:output_path) { File.join(output_dir, "premaster.wav") }
  let(:status) { instance_double(Process::Status, success?: true) }
  let(:recipe) do
    {
      processing_chain: [
        {
          type: "highpass_filter",
          enabled: true,
          frequency_hz: 25
        },
        {
          type: "eq",
          enabled: true,
          bands: [
            {
              filter: "high_shelf",
              frequency_hz: 8000,
              gain_db: -3,
              q: 0.5
            }
          ]
        },
        {
          type: "lowpass_filter",
          enabled: true,
          frequency_hz: 12_000,
          slope_db_per_oct: 12
        },
        {
          type: "limiter",
          enabled: false
        }
      ],
      export: {
        sample_rate_hz: 44_100,
        dither: false
      }
    }
  end

  before do
    allow(Dir).to receive(:mktmpdir).and_return(output_dir)
    allow(Open3).to receive(:capture3) do |*args|
      File.binwrite(output_path, "rendered-wav")
      ["", "", status]
    end
  end

  after do
    FileUtils.remove_entry(output_dir) if Dir.exist?(output_dir)
  end

  it "renders a low-pass filter when the recipe includes an extreme high-cut stage" do
    described_class.new(
      input_path: "/tmp/source.wav",
      recipe: recipe,
      analysis_before: { integrated_lufs: -12.0 }
    ).call

    expect(Open3).to have_received(:capture3)
    expect(Open3).to have_received(:capture3) do |*args|
      filter = args[args.index("-filter:a") + 1]

      expect(filter).to include("treble=f=8000.0:g=-3.0:width_type=q:width=0.5")
      expect(filter).to include("lowpass=f=12000.0")
    end
  end
end
