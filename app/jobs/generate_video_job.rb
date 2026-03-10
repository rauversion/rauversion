class GenerateVideoJob < ApplicationJob
  queue_as :default

  def perform(user_id:, options:, cover_image_blob_id: nil, audio_file_blob_id: nil, cover_image_path: nil, audio_file_path: nil)
    user = User.find(user_id)
    output_file = Rails.root.join("tmp", "output-#{SecureRandom.hex(8)}.mp4").to_s
    Rails.logger.info(
      "GenerateVideoJob started user_id=#{user.id} " \
      "cover_image_blob_id=#{cover_image_blob_id.inspect} audio_file_blob_id=#{audio_file_blob_id.inspect} " \
      "cover_image_path=#{cover_image_path.inspect} audio_file_path=#{audio_file_path.inspect} " \
      "options=#{options.inspect} output_file=#{output_file}"
    )

    with_input_path(blob_id: cover_image_blob_id, legacy_path: cover_image_path) do |resolved_cover_image_path|
      with_input_path(blob_id: audio_file_blob_id, legacy_path: audio_file_path) do |resolved_audio_file_path|
        Rails.logger.info(
          "GenerateVideoJob invoking generator user_id=#{user.id} " \
          "resolved_cover_image_path=#{resolved_cover_image_path} " \
          "resolved_audio_file_path=#{resolved_audio_file_path}"
        )
        generator = VideoGenerator.new(
          cover_image: resolved_cover_image_path,
          audio_file: resolved_audio_file_path,
          audio_start: options[:audio_start],
          audio_end: options[:audio_end],
          color: options[:bg_color] || "red",
          disc_size: options[:disc_size],
          duration: options[:duration] || 5,
          loop_speed: options[:loop_speed] || 1,
          output_file: output_file
        )
        generator.generate!
      end
    end

    Rails.logger.info(
      "GenerateVideoJob ffmpeg completed user_id=#{user.id} " \
      "output_file=#{output_file} output_exists=#{File.exist?(output_file)} " \
      "output_size=#{File.exist?(output_file) ? File.size(output_file) : 0}"
    )

    video_blob = File.open(output_file, "rb") do |file|
      ActiveStorage::Blob.create_and_upload!(
        io: file,
        filename: "generated_video_#{Time.current.to_i}.mp4",
        content_type: "video/mp4"
      )
    end

    Rails.logger.info(
      "GenerateVideoJob uploaded video blob user_id=#{user.id} " \
      "video_blob_id=#{video_blob.id} filename=#{video_blob.filename} byte_size=#{video_blob.byte_size}"
    )

    video_url = Rails.application.routes.url_helpers.rails_blob_url(
      video_blob,
      only_path: false,
      host: Rails.application.config.action_mailer.default_url_options[:host],
      disposition: "attachment"
    )

    Rails.logger.info("GenerateVideoJob final video URL user_id=#{user.id} video_url=#{video_url}")

    VideoMailer.with(user: user, video_url: video_url).video_ready.deliver_now

    Rails.logger.info("GenerateVideoJob email delivered user_id=#{user.id} email=#{user.email} video_url=#{video_url}")
  rescue => e
    Rails.logger.error(
      "GenerateVideoJob failed user_id=#{user_id.inspect} " \
      "cover_image_blob_id=#{cover_image_blob_id.inspect} audio_file_blob_id=#{audio_file_blob_id.inspect} " \
      "#{e.class}: #{e.message}\n#{e.backtrace&.first(10)&.join("\n")}"
    )
    raise
  ensure
    cleanup_file(output_file)
    cleanup_legacy_file(cover_image_path, blob_id: cover_image_blob_id)
    cleanup_legacy_file(audio_file_path, blob_id: audio_file_blob_id)
    purge_ephemeral_blob(cover_image_blob_id)
    purge_ephemeral_blob(audio_file_blob_id)
  end

  private

  def with_input_path(blob_id:, legacy_path:)
    if blob_id.present?
      blob = ActiveStorage::Blob.find(blob_id)
      Rails.logger.info(
        "GenerateVideoJob downloading blob blob_id=#{blob.id} filename=#{blob.filename} " \
        "byte_size=#{blob.byte_size} content_type=#{blob.content_type}"
      )

      blob.open(tmpdir: Rails.root.join("tmp")) do |file|
        Rails.logger.info(
          "GenerateVideoJob opened blob blob_id=#{blob.id} temp_path=#{file.path} " \
          "temp_size=#{File.exist?(file.path) ? File.size(file.path) : 0}"
        )
        yield file.path
      end
    else
      Rails.logger.info("GenerateVideoJob using legacy path path=#{legacy_path.inspect}")
      yield legacy_path
    end
  end

  def cleanup_file(path)
    File.delete(path) if path.present? && File.exist?(path)
  end

  def cleanup_legacy_file(path, blob_id:)
    return if blob_id.present?

    cleanup_file(path)
  end

  def purge_ephemeral_blob(blob_id)
    return if blob_id.blank?

    ActiveStorage::Blob.find_by(id: blob_id)&.purge
  end
end
