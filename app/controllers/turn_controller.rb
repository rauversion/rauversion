class TurnController < ApplicationController
  before_action :authenticate_user!
  before_action :guard_artist

  def show
    render_blank
  end

  # POST /turn/generate_video
  def generate_video
    cover_image_file = params[:cover_image]
    audio_file = params[:audio_file]
    return render_missing_files_error if cover_image_file.blank? || audio_file.blank?

    cover_image_blob = upload_source_blob!(cover_image_file)
    audio_file_blob = upload_source_blob!(audio_file)

    duration = params[:duration] || 5
    loop_speed = params[:loop_speed] || 1
    audio_start = params[:audio_start]
    audio_end = params[:audio_end]
    bg_color = params[:bg_color] || "red"
    disc_size = params[:disc_size]

    GenerateVideoJob.perform_later(
      user_id: current_user.id,
      cover_image_blob_id: cover_image_blob.id,
      audio_file_blob_id: audio_file_blob.id,
      options: {
        audio_start: audio_start,
        audio_end: audio_end,
        bg_color: bg_color,
        disc_size: disc_size,
        duration: duration,
        loop_speed: loop_speed
      }
    )

    render json: { success: true, message: "Video generation started. You will receive an email with the download link when it's ready." }
  rescue => e
    cover_image_blob&.purge
    audio_file_blob&.purge
    render json: { success: false, error: e.message }, status: 422
  end

  private

  def render_missing_files_error
    render json: { success: false, error: "cover_image and audio_file are required" }, status: :unprocessable_entity
  end

  def upload_source_blob!(uploaded_file)
    raise ArgumentError, "Uploaded file is invalid" unless uploaded_file.respond_to?(:tempfile)

    uploaded_file.tempfile.rewind

    ActiveStorage::Blob.create_and_upload!(
      io: uploaded_file.tempfile,
      filename: uploaded_file.original_filename,
      content_type: uploaded_file.content_type
    )
  end
end
