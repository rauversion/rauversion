class TurnController < ApplicationController

  before_action :authenticate_user!
  before_action :guard_artist

  def show
    render_blank
  end

  # POST /turn/generate_video
  def generate_video
    # Handle file uploads
    cover_image_file = params[:cover_image]
    audio_file = params[:audio_file]
    # mask_image_file = params[:mask_image]

    # Save uploaded files to temp files
    cover_image_path = cover_image_file ? save_uploaded_file(cover_image_file, "cover_image") : nil
    audio_file_path = audio_file ? save_uploaded_file(audio_file, "audio_file") : nil
    # mask_image_path = mask_image_file ? save_uploaded_file(mask_image_file, "mask_image") : nil

    # Extract other options
    duration = params[:duration] || 5
    loop_speed = params[:loop_speed] || 1
    audio_start = params[:audio_start]
    audio_end = params[:audio_end]
    bg_color = params[:bg_color] || "red"
    format = params[:format] || "mp4"
    disc_size = params[:disc_size]
    output_file = Rails.root.join("public", "output.mp4").to_s

    # Enqueue background job for video generation
    GenerateVideoJob.perform_later(
      user_id: current_user.id,
      cover_image_path: cover_image_path,
      audio_file_path: audio_file_path,
      options: {
        audio_start: audio_start,
        audio_end: audio_end,
        bg_color: bg_color,
        disc_size: disc_size,
        duration: duration,
        loop_speed: loop_speed
      }
    )

    # Respond immediately
    render json: { success: true, message: "Video generation started. You will receive an email with the download link when it's ready." }
  rescue => e
    render json: { success: false, error: e.message }, status: 422
  end

  private

  def save_uploaded_file(uploaded_file, prefix)
    ext = File.extname(uploaded_file.original_filename)
    path = Rails.root.join("tmp", "#{prefix}_#{SecureRandom.hex(8)}#{ext}")
    File.open(path, "wb") { |f| f.write(uploaded_file.read) }
    path.to_s
  end
end
