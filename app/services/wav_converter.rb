require "open3"

class WavConverter
  def initialize(file)
    @file = file
  end

  def run
    dir = Dir.mktmpdir("wav-converter")
    filename = File.basename(@file, File.extname(@file))
    output_file = File.join(dir, "#{filename}.wav")

    args = [
      ffmpeg_path,
      "-i", @file,
      "-vn",
      "-ar", "44100",
      "-ac", "2",
      "-c:a", "pcm_s16le",
      output_file
    ]

    stdout, stderr, status = Open3.capture3(*args)
    Rails.logger.info("WavConverter stdout=#{stdout}") if stdout.present?
    Rails.logger.warn("WavConverter stderr=#{stderr}") if stderr.present?

    raise "ffmpeg failed to generate wav" unless status.success? && File.exist?(output_file)

    output_file
  end

  private

  def ffmpeg_path
    "ffmpeg"
  end
end
