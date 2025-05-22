# lib/tasks/video.rake

namespace :video do
  desc "Generate a video from cover.jpg and track.mp3 using ffmpeg"
  task :generate do
    ffmpeg_cmd = <<-CMD
      ffmpeg  \
      -f lavfi -t 5 -i color=c=red:s=1080x1080 \
      -loop 1 -t 5 -i ./app/assets/images/1080x.png \
      -i ./app/assets/images/alpha_mask.png \
      -i ./spec/fixtures/audio.mp3 \
      -filter_complex "\
        [1:v]scale=1080:1080[scaled]; \
        [scaled]pad=1080:1080:(ow-iw)/2:(oh-ih)/2:color=black@0,format=rgba[padded]; \
        [padded]rotate=2*PI*t/1:c=none:ow=rotw(1080):oh=roth(1080),scale=1080:1080[rotated]; \
        [2:v]scale=1080:1080,format=gray[mask]; \
        [rotated][mask]alphamerge[masked]; \
        [0:v][masked]overlay=0:0:format=auto,format=yuv420p[vout]" \
      -map "[vout]" -map 3:a \
      -t 5 \
      -c:v libx264 -c:a aac \
      -pix_fmt yuv420p \
      -movflags +faststart \
      -y output.mp4
    CMD


   
    puts "Running ffmpeg to generate output.mp4..."
    system(ffmpeg_cmd)
    puts "Done. Check output.mp4."
  end

  # /Users/michelson/Documents/rauversion/rauversion/rauversion-ror/app/assets/images/mask.png'
end
