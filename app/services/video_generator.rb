# app/services/video_generator.rb

class VideoGenerator
  attr_reader :cover_image, :audio_file, :audio_start, :audio_end, :format,
              :duration, :loop_speed, :mask_image, :output_file, :color, :disc_size

  # options:
  #   cover_image: path to cover image (default: './app/assets/images/1080x.png')
  #   audio_file: path to audio file (default: './spec/fixtures/audio.mp3')
  #   audio_start: start time in seconds (optional)
  #   audio_end: end time in seconds (optional)
  #   format: output format (default: 'mp4')
  #   duration: video duration in seconds (default: 5)
  #   loop_speed: rotation speed in RPM (default: 1)
  #   mask_image: path to mask image (default: './app/assets/images/alpha_mask.png')
  #   output_file: output file path (default: 'output.mp4')
  #   color: background color (default: 'red')
  #   disc_size: disc size as percentage (20-100, default: 100)
  def initialize(
    cover_image: Rails.root.to_s + '/app/assets/images/1080x.png',
    audio_file: Rails.root.to_s + '/spec/fixtures/audio.mp3',
    audio_start: nil,
    audio_end: nil,
    format: 'mp4',
    duration: 5,
    loop_speed: 1,
    mask_image: Rails.root.to_s + '/app/assets/images/alpha_mask.png',
    output_file: 'output.mp4',
    color: 'red',
    disc_size: 100
  )
    @cover_image = cover_image
    @audio_file = audio_file
    @audio_start = audio_start
    @audio_end = audio_end
    @format = format
    @duration = duration
    @loop_speed = loop_speed
    @mask_image = mask_image
    @output_file = output_file
    @color = color
    @disc_size = disc_size
  end

  def generate!
    # Build audio trim options if needed
    audio_trim = ""
    if audio_start || audio_end
      audio_trim += "-ss #{audio_start} " if audio_start
      audio_trim += "-to #{audio_end} " if audio_end
    end

    # Calculate mask and cover size based on disc_size percentage
    mask_px = (1080 * (@disc_size.to_f / 100)).round
    cover_px = [(mask_px * 1.05).round, 1080].min
    mask_scale_and_pad = "scale=#{mask_px}:#{mask_px},pad=1080:1080:(ow-iw)/2:(oh-ih)/2"
    cover_scale_and_pad = "scale=#{cover_px}:#{cover_px},pad=1080:1080:(ow-iw)/2:(oh-ih)/2"

    # Build ffmpeg command as a single line to avoid shell parsing issues
    filter_complex = (
      "[0:v]scale=1296:1296,crop=1080:1080:((in_w-out_w)/2):((in_h-out_h)/2)[bg];" \
      "[1:v]#{cover_scale_and_pad},format=rgba[scaled];" \
      "[scaled]rotate=2*PI*#{loop_speed}*t/60:c=none:ow=rotw(1080):oh=roth(1080),scale=1080:1080[rotated];" \
      "[2:v]#{mask_scale_and_pad},format=gray,lut=a=\\'val>0?255:0\\'[mask];" \
      "[rotated][mask]alphamerge[masked];" \
      "[bg][masked]overlay=0:0:format=auto,format=yuv420p[vout]"
    )

    ffmpeg_cmd = [
      "ffmpeg",
      "-f lavfi -t #{duration} -i color=c=#{color}:s=1080x1080",
      "-loop 1 -t #{duration} -i \"#{cover_image}\"",
      "-i \"#{mask_image}\"",
      "#{audio_trim}-i \"#{audio_file}\"",
      "-filter_complex \"#{filter_complex}\"",
      "-map \"[vout]\" -map 3:a",
      "-t #{duration}",
      "-c:v libx264 -c:a aac",
      "-pix_fmt yuv420p",
      "-movflags +faststart",
      "-y \"#{output_file}\""
    ].join(" ")

    puts "Running ffmpeg to generate #{output_file}..."
    puts "Running command: #{ffmpeg_cmd}"
    system(ffmpeg_cmd)
    puts "Done. Check #{output_file}."
  end
end
