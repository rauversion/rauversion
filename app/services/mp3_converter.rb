require "tempfile"
require "open3"

class Mp3Converter
  def initialize(file)
    @file = file
  end

  def run
    dir = Dir.mktmpdir("my-dir")

    filename = File.basename(@file, File.extname(@file))

    output_file = "#{dir}/#{filename}.mp3"

    args = [
      ffmpeg_path,
      "-i", @file,
      "-vn",
      "-ar", "44100",
      "-ac", "2",
      "-b:a", "192k",
      output_file
    ]

    stdout, stderr, status = Open3.capture3(*args)

    log_output(:info, "stdout", stdout)
    log_output(status.success? ? :info : :warn, "stderr", stderr)

    raise "ffmpeg failed to generate mp3" unless status.success? && File.exist?(output_file)

    output_file
  end

  private

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
