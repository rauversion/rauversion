require "rails_helper"

RSpec.describe VideoGenerator, type: :service do
  let(:output_file) { Rails.root.join("tmp", "video-generator-spec-output.mp4").to_s }

  after do
    File.delete(output_file) if File.exist?(output_file)
  end

  it "invokes ffmpeg without going through the shell and supports hex colors" do
    generator = described_class.new(
      cover_image: Rails.root.join("spec/fixtures/files/sample.jpg").to_s,
      audio_file: Rails.root.join("spec/fixtures/audio.mp3").to_s,
      color: "#faafc8",
      output_file: output_file
    )

    expect(generator).to receive(:system) do |*args|
      expect(args.first).to eq("ffmpeg")
      expect(args).to include("color=c=#faafc8:s=1080x1080")
      File.binwrite(output_file, "fake-video")
      true
    end

    expect { generator.generate! }.not_to raise_error
  end

  it "raises when ffmpeg does not produce an output file" do
    generator = described_class.new(
      cover_image: Rails.root.join("spec/fixtures/files/sample.jpg").to_s,
      audio_file: Rails.root.join("spec/fixtures/audio.mp3").to_s,
      output_file: output_file
    )

    allow(generator).to receive(:system).and_return(false)

    expect { generator.generate! }.to raise_error("ffmpeg failed to generate video")
  end
end
