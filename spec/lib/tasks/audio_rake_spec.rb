require "rails_helper"
require "rake"

RSpec.describe "audio:merge_opus" do
  before(:all) do
    Rails.application.load_tasks unless Rake::Task.task_defined?("audio:merge_opus")
  end

  let(:task) { Rake::Task["audio:merge_opus"] }

  before do
    task.reenable
  end

  around do |example|
    original_env = ENV.to_h
    %w[DIR SOURCE_DIR OUTPUT MERGED_OUTPUT].each { |key| ENV.delete(key) }
    example.run
  ensure
    ENV.replace(original_env)
  end

  it "merges opus files ordered by filename and converts the merged opus to wav" do
    source_dir = Dir.mktmpdir("opus-source")
    output_dir = Dir.mktmpdir("opus-output")
    wav_path = File.join(output_dir, "session.wav")
    merged_opus_path = File.join(output_dir, "session.opus")
    concat_list = nil

    File.binwrite(File.join(source_dir, "02 second.opus"), "second")
    File.binwrite(File.join(source_dir, "01 artist's first.opus"), "first")
    File.binwrite(File.join(source_dir, "notes.txt"), "ignored")

    ENV["SOURCE_DIR"] = source_dir
    ENV["OUTPUT"] = wav_path
    ENV["MERGED_OUTPUT"] = merged_opus_path

    allow(Open3).to receive(:capture3) do |*args|
      if args.include?("-f") && args.include?("concat")
        concat_list = File.read(args[args.index("-i") + 1])
        File.binwrite(args.last, "merged opus")
      else
        File.binwrite(args.last, "converted wav")
      end

      ["", "", instance_double(Process::Status, success?: true)]
    end

    expect do
      task.invoke
    end.to output(
      a_string_including(
        "[INFO] opus_files=2",
        "[FILE] 01 artist's first.opus",
        "[FILE] 02 second.opus",
        "[OK] merged_opus=#{merged_opus_path}",
        "[OK] wav=#{wav_path}"
      )
    ).to_stdout

    expect(concat_list).to eq(
      "file '#{File.join(source_dir, "01 artist's first.opus").gsub("'", "'\\''")}'\n" \
      "file '#{File.join(source_dir, "02 second.opus")}'\n"
    )
    expect(Open3).to have_received(:capture3).with(
      "ffmpeg",
      "-hide_banner",
      "-loglevel", "error",
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", kind_of(String),
      "-c", "copy",
      merged_opus_path
    )
    expect(Open3).to have_received(:capture3).with(
      "ffmpeg",
      "-hide_banner",
      "-loglevel", "error",
      "-y",
      "-i", merged_opus_path,
      "-vn",
      "-ar", "44100",
      "-ac", "2",
      "-c:a", "pcm_s16le",
      wav_path
    )
  ensure
    FileUtils.remove_entry(source_dir) if source_dir && Dir.exist?(source_dir)
    FileUtils.remove_entry(output_dir) if output_dir && Dir.exist?(output_dir)
  end

  it "aborts with usage when no source folder is provided" do
    expect do
      task.invoke
    end.to raise_error(SystemExit)
      .and output(/Usage: bin\/rails 'audio:merge_opus\[\/path\/to\/folder\]'/).to_stderr
  end
end
