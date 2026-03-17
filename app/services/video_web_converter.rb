require "open3"

class VideoWebConverter
  def initialize(file)
    @file = file
  end

  def run
    dir = Dir.mktmpdir("video-web-converter")
    filename = File.basename(@file, File.extname(@file))
    output_file = File.join(dir, "#{filename}-web.mp4")

    args = [
      ffmpeg_path,
      "-i", @file,
      "-an",
      "-vf", "scale='min(1280,iw)':-2,fps=30",
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "24",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      output_file
    ]

    stdout, stderr, status = Open3.capture3(*args)
    Rails.logger.info("VideoWebConverter stdout=#{stdout}") if stdout.present?
    Rails.logger.warn("VideoWebConverter stderr=#{stderr}") if stderr.present?

    raise "ffmpeg failed to generate web video" unless status.success? && File.exist?(output_file)

    output_file
  end

  private

  def ffmpeg_path
    "ffmpeg"
  end
end
