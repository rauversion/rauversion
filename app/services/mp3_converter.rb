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

    Rails.logger.info("Mp3Converter stdout=#{stdout}") if stdout.present?
    Rails.logger.warn("Mp3Converter stderr=#{stderr}") if stderr.present?

    raise "ffmpeg failed to generate mp3" unless status.success? && File.exist?(output_file)

    output_file
  end

  private

  def ffmpeg_path
    "ffmpeg"
  end
end
