require "fileutils"
require "open3"
require "pathname"
require "tempfile"

module AudioRakeTasks
  class OpusFolderMerger
    Error = Class.new(StandardError)

    attr_reader :source_dir, :merged_opus_path, :wav_path

    def initialize(source_dir:, merged_opus_path:, wav_path:)
      @source_dir = Pathname.new(source_dir).expand_path
      @merged_opus_path = Pathname.new(merged_opus_path).expand_path
      @wav_path = Pathname.new(wav_path).expand_path
    end

    def run
      validate_source_dir!

      opus_files = sorted_opus_files
      raise Error, "No .opus files found in #{source_dir}" if opus_files.empty?

      FileUtils.mkdir_p(merged_opus_path.dirname)
      FileUtils.mkdir_p(wav_path.dirname)

      puts "[INFO] source_dir=#{source_dir}"
      puts "[INFO] opus_files=#{opus_files.count}"
      opus_files.each { |path| puts "[FILE] #{path.basename}" }

      merge_opus_files(opus_files)
      convert_merged_opus_to_wav

      puts "[OK] merged_opus=#{merged_opus_path}"
      puts "[OK] wav=#{wav_path}"

      wav_path.to_s
    end

    private

    def validate_source_dir!
      raise Error, "Source folder does not exist: #{source_dir}" unless source_dir.directory?
    end

    def sorted_opus_files
      Dir.glob(source_dir.join("*.opus").to_s)
        .map { |path| Pathname.new(path).expand_path }
        .reject { |path| path == merged_opus_path }
        .sort_by { |path| path.basename.to_s }
    end

    def merge_opus_files(opus_files)
      Tempfile.create(["opus-concat-list", ".txt"]) do |list_file|
        list_file.write(opus_files.map { |path| concat_file_line(path) }.join("\n"))
        list_file.write("\n")
        list_file.flush

        run_ffmpeg!(
          "ffmpeg failed to merge opus files",
          "ffmpeg",
          "-hide_banner",
          "-loglevel", "error",
          "-y",
          "-f", "concat",
          "-safe", "0",
          "-i", list_file.path,
          "-c", "copy",
          merged_opus_path.to_s
        )
      end
    end

    def convert_merged_opus_to_wav
      run_ffmpeg!(
        "ffmpeg failed to convert merged opus to wav",
        "ffmpeg",
        "-hide_banner",
        "-loglevel", "error",
        "-y",
        "-i", merged_opus_path.to_s,
        "-vn",
        "-ar", "44100",
        "-ac", "2",
        "-c:a", "pcm_s16le",
        wav_path.to_s
      )
    end

    def run_ffmpeg!(error_message, *args)
      stdout, stderr, status = Open3.capture3(*args)
      log_output("stdout", stdout)
      log_output("stderr", stderr)

      raise Error, error_message unless status.success? && File.exist?(args.last)
    end

    def concat_file_line(path)
      "file '#{path.to_s.gsub("'", "'\\''")}'"
    end

    def log_output(stream, output)
      return if output.to_s.empty?

      puts "[FFMPEG #{stream.upcase}] #{loggable_output(output)}"
    end

    def loggable_output(output)
      output.to_s.encode(Encoding::UTF_8, invalid: :replace, undef: :replace, replace: "?")
    end
  end
end

namespace :audio do
  # Merges every .opus file in the given folder, sorted by filename, into a
  # single opus file and then converts that merged file to wav with ffmpeg.
  #
  # Usage:
  #   bin/rails 'audio:merge_opus[/path/to/folder]'
  #   bin/rails 'audio:merge_opus[/path/to/folder,/tmp/output.wav]'
  #   SOURCE_DIR=/path/to/folder OUTPUT=/tmp/output.wav bin/rails audio:merge_opus
  #
  # Optional env vars:
  #   MERGED_OUTPUT=/tmp/merged.opus
  #   OUTPUT=/tmp/merged.wav
  #
  # Default outputs are created inside the source folder:
  #   merged.opus
  #   merged.wav
  desc "Merge sorted .opus files from a folder and convert the merged file to wav. Usage: bin/rails 'audio:merge_opus[/path/to/folder]'"
  task :merge_opus, [:source_dir, :wav_path] do |_task, args|
    source_dir = args[:source_dir] || ENV["SOURCE_DIR"] || ENV["DIR"]

    if source_dir.to_s.empty?
      abort "Usage: bin/rails 'audio:merge_opus[/path/to/folder]' or SOURCE_DIR=/path/to/folder bin/rails audio:merge_opus"
    end

    expanded_source_dir = Pathname.new(source_dir).expand_path
    merged_opus_path = ENV["MERGED_OUTPUT"] || expanded_source_dir.join("merged.opus").to_s
    wav_path = args[:wav_path] || ENV["OUTPUT"] || expanded_source_dir.join("merged.wav").to_s

    AudioRakeTasks::OpusFolderMerger.new(
      source_dir: expanded_source_dir.to_s,
      merged_opus_path: merged_opus_path,
      wav_path: wav_path
    ).run
  rescue AudioRakeTasks::OpusFolderMerger::Error => e
    abort "[ERROR] #{e.message}"
  end
end
