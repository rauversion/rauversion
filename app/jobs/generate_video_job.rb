class GenerateVideoJob < ApplicationJob
  queue_as :default

  def perform(user_id:, cover_image_path:, audio_file_path:, options:)
    user = User.find(user_id)
    output_file = Rails.root.join("tmp", "output-#{SecureRandom.hex(8)}.mp4").to_s

    # Generate the video
    generator = VideoGenerator.new(
      cover_image: cover_image_path,
      audio_file: audio_file_path,
      audio_start: options[:audio_start],
      audio_end: options[:audio_end],
      color: options[:bg_color] || "red",
      disc_size: options[:disc_size],
      duration: options[:duration] || 5,
      loop_speed: options[:loop_speed] || 1,
      output_file: output_file
    )
    generator.generate!


    puts "Video generation completed for user #{user.id}."


    # Attach to ActiveStorage as a blob
    video_blob = ActiveStorage::Blob.create_and_upload!(
      io: File.open(output_file, "rb"),
      filename: "generated_video_#{Time.now.to_i}.mp4",
      content_type: "video/mp4"
    )

    # Generate a URL for the video (signed, expires in 24h)
    video_url = Rails.application.routes.url_helpers.rails_blob_url(video_blob, only_path: false, host: Rails.application.config.action_mailer.default_url_options[:host], disposition: "attachment")

    # Send the email with the link
    VideoMailer.with(user: user, video_url: video_url).video_ready.deliver_now

    puts "Video generation completed for user #{user.id}. Video URL: #{video_url}"
    # Cleanup temp files
    File.delete(output_file) if File.exist?(output_file)
    File.delete(cover_image_path) if cover_image_path && File.exist?(cover_image_path)
    File.delete(audio_file_path) if audio_file_path && File.exist?(audio_file_path)
  end
end
