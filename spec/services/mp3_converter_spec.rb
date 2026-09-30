require "rails_helper"

RSpec.describe Mp3Converter do
  let(:source_file) do
    Tempfile.new(["source-audio", ".wav"]).tap do |file|
      File.binwrite(file.path, "fake audio")
      file.close
    end
  end

  after do
    source_file.unlink
  end

  it "logs stderr without raising when ffmpeg emits invalid UTF-8 bytes" do
    generated_output_path = nil
    invalid_stderr = +"ffmpeg output \xFF"
    invalid_stderr.force_encoding(Encoding::UTF_8)

    allow(Open3).to receive(:capture3) do |*args|
      generated_output_path = args.last
      File.binwrite(generated_output_path, "fake mp3")
      ["", invalid_stderr, instance_double(Process::Status, success?: true)]
    end

    expect(Rails.logger).to receive(:info).with("Mp3Converter stderr=ffmpeg output ?")

    expect { described_class.new(source_file.path).run }.not_to raise_error
  ensure
    output_dir = File.dirname(generated_output_path) if generated_output_path
    FileUtils.remove_entry(output_dir) if output_dir && Dir.exist?(output_dir)
  end

  it "renders only the selected window with ffmpeg" do
    source = Rails.root.join("spec/fixtures/audio.mp3").to_s
    path = described_class.new(source, start_seconds: 0.1, duration_seconds: 0.2).run
    output, _stderr, status = Open3.capture3(
      "ffprobe", "-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", path
    )

    expect(status).to be_success
    # MP3 frame padding adds a few milliseconds to the requested window.
    expect(output.to_f).to be_within(0.06).of(0.2)
  ensure
    FileUtils.remove_entry(File.dirname(path)) if path && File.exist?(path)
  end

  it "rejects a window beyond the original rather than creating a different excerpt" do
    source = Rails.root.join("spec/fixtures/audio.mp3").to_s
    expect do
      described_class.new(source, start_seconds: 0.3, duration_seconds: 1).run
    end.to raise_error(ArgumentError, /exceeds/)
  end

  it "rejects invalid window parameters before calling ffmpeg" do
    expect(Open3).not_to receive(:capture3)
    expect do
      described_class.new(source_file.path, start_seconds: -1, duration_seconds: 10).run
    end.to raise_error(ArgumentError, /Invalid/)
  end
end
