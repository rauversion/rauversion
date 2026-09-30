require "tempfile"
require "open3"

class Mp3Converter
  def initialize(file, start_seconds: nil, duration_seconds: nil)
    @file = file
    @start_seconds = start_seconds
    @duration_seconds = duration_seconds
  end

  def run
    validate_window! if @duration_seconds || @start_seconds
    dir = Dir.mktmpdir("my-dir")

    filename = File.basename(@file, File.extname(@file))

    output_file = "#{dir}/#{filename}.mp3"

    args = [ffmpeg_path]
    args.concat(["-ss", @start_seconds.to_s]) if @start_seconds
    args.concat(["-i", @file])
    args.concat(["-t", @duration_seconds.to_s]) if @duration_seconds
    args.concat([
      "-vn",
      "-ar", "44100",
      "-ac", "2",
      "-b:a", "192k",
      output_file
    ])

    stdout, stderr, status = Open3.capture3(*args)

    log_output(:info, "stdout", stdout)
    log_output(status.success? ? :info : :warn, "stderr", stderr)

    raise "ffmpeg failed to generate mp3" unless status.success? && File.exist?(output_file)

    output_file
  rescue StandardError
    FileUtils.remove_entry(dir) if dir && Dir.exist?(dir)
    raise
  end

  private

  def validate_window!
    start = Float(@start_seconds)
    duration = Float(@duration_seconds)
    unless start.finite? && duration.finite? && start >= 0 && duration > 0
      raise ArgumentError, "Invalid preview window"
    end

    stdout, _stderr, status = Open3.capture3(
      "ffprobe", "-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", @file
    )
    source_duration = Float(stdout.strip) if status.success?
    unless source_duration&.finite? && start + duration <= source_duration
      raise ArgumentError, "Preview window exceeds the original audio duration"
    end
  end

  def ffmpeg_path
    "ffmpeg"
  end

  def log_output(level, stream, output)
    return unless output.to_s.bytesize.positive?

    Rails.logger.public_send(level, "Mp3Converter #{stream}=#{loggable_output(output)}")
  end

  def loggable_output(output)
    output.to_s.encode(Encoding::UTF_8, invalid: :replace, undef: :replace, replace: "?")
  end
end
