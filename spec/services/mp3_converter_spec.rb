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
end
