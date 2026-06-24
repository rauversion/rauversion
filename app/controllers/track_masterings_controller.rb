class TrackMasteringsController < ApplicationController
  before_action :authenticate_user!
  before_action :require_mastering_access!
  before_action :set_track
  before_action :set_track_master, only: [:show, :download, :retry, :destroy]

  layout :layout_by_resource

  def index
    load_masters

    respond_to do |format|
      format.html { render_blank }
      format.json do
        render json: {
          track: track_json(@track),
          masters: @masters.map { |master| track_master_json(master) },
          target_profiles: target_profiles_json
        }
      end
    end
  end

  def new
    @track_master = @track.track_masters.new(target_profile: params[:target_profile].presence || "demo_balanced")
    load_recent_masters

    respond_to do |format|
      format.html { render_blank }
      format.json do
        render json: {
          track: track_json(@track),
          track_master: track_master_json(@track_master),
          recent_masters: @recent_masters.map { |master| track_master_json(master) },
          target_profiles: target_profiles_json
        }
      end
    end
  end

  def create
    @track_master = @track.track_masters.new(track_master_params)

    unless @track.analyzable_audio_media&.attached? || @track.playback_media&.attached?
      @track_master.errors.add(:base, "Este track no tiene audio procesable.")
      return render_unprocessable_master
    end

    if @track_master.save
      MasterTrackJob.perform_later(@track_master.id)
      respond_to do |format|
        format.html { redirect_to track_mastering_path(@track, @track_master), notice: "Master en proceso." }
        format.json { render json: { track_master: track_master_json(@track_master) }, status: :created }
      end
    else
      render_unprocessable_master
    end
  end

  def show
    respond_to do |format|
      format.html { render_blank }
      format.json do
        render json: {
          track: track_json(@track),
          track_master: track_master_json(@track_master),
          target_profiles: target_profiles_json
        }
      end
    end
  end

  def download
    unless @track_master.ready?
      redirect_to track_mastering_path(@track, @track_master), alert: "El archivo todavia no esta listo."
      return
    end

    redirect_to rails_blob_path(@track_master.audio, disposition: "attachment")
  end

  def retry
    if @track_master.pending? || @track_master.running?
      render json: { errors: ["El master ya esta en proceso."] }, status: :unprocessable_entity
      return
    end

    unless @track.analyzable_audio_media&.attached? || @track.playback_media&.attached?
      render json: { errors: ["Este track no tiene audio procesable."] }, status: :unprocessable_entity
      return
    end

    @track_master.retry!(
      feedback: retry_params[:feedback],
      reference_notes: retry_params[:reference_notes]
    )
    MasterTrackJob.perform_later(@track_master.id)

    render json: { track_master: track_master_json(@track_master) }, status: :accepted
  end

  def destroy
    if @track_master.pending? || @track_master.running?
      respond_to do |format|
        format.html { redirect_to track_mastering_path(@track, @track_master), alert: "No se puede eliminar un master en proceso." }
        format.json { render json: { errors: ["No se puede eliminar un master en proceso."] }, status: :unprocessable_entity }
      end
      return
    end

    deleted_id = @track_master.id
    @track_master.destroy!

    respond_to do |format|
      format.html { redirect_to track_masterings_path(@track), notice: "Master eliminado." }
      format.json { render json: { deleted_id: deleted_id } }
    end
  end

  private

  def require_mastering_access!
    return if current_user.can_access_mastering?

    respond_to do |format|
      format.html { redirect_to root_path, alert: "Mastering no esta habilitado para tu cuenta." }
      format.json { render json: { errors: ["Mastering no esta habilitado para tu cuenta."] }, status: :forbidden }
    end
  end

  def set_track
    @track = current_user.tracks.friendly.find(params[:track_id])
  end

  def set_track_master
    @track_master = @track.track_masters.find(params[:id])
  end

  def track_master_params
    params.require(:track_master).permit(:target_profile, :feedback, :reference_notes)
  end

  def retry_params
    params.fetch(:track_master, {}).permit(:feedback, :reference_notes)
  end

  def load_recent_masters
    @recent_masters = @track.track_masters.latest_first.limit(5)
  end

  def load_masters
    @masters = @track.track_masters.latest_first
  end

  def render_unprocessable_master
    load_recent_masters
    render json: {
      errors: @track_master.errors.full_messages,
      track: track_json(@track),
      track_master: track_master_json(@track_master),
      recent_masters: @recent_masters.map { |master| track_master_json(master) },
      target_profiles: target_profiles_json
    }, status: :unprocessable_entity
  end

  def track_json(track)
    {
      id: track.id,
      title: track.title,
      slug: track.slug,
      genre: track.genre,
      processed: track.processed?,
      playback_url: playback_url(track),
      cover_url: cover_url_json(track),
      user: {
        id: track.user.id,
        username: track.user.username,
        display_name: track.user.display_name
      }
    }
  end

  def track_master_json(master)
    Mastering::TrackMasterSerializer.new(master).as_json
  end

  def target_profiles_json
    Mastering::TargetProfiles.all.map do |key, profile|
      {
        key: key,
        label_es: profile[:label_es],
        target_lufs: profile[:target_lufs],
        true_peak_ceiling_db: profile[:true_peak_ceiling_db],
        style_es: profile[:style_es]
      }
    end
  end

  def playback_url(track)
    media = track.playback_media
    MediaStreamUrl.for(media)
  end

  def cover_url_json(track)
    if track.cover.attached?
      {
        small: track.cover_url(:small),
        medium: track.cover_url(:medium),
        large: track.cover_url(:large),
        cropped_image: url_for(track.cropped_image)
      }
    else
      fallback = AlbumsHelper.default_image_sqr
      {
        small: fallback,
        medium: fallback,
        large: fallback,
        cropped_image: fallback
      }
    end
  end
end
