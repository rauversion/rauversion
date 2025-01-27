class ReleasesController < ApplicationController
  before_action :find_playlist, except: [:puck, :upload_puck_image, :edit]
  before_action :disable_footer, only: [:puck]

  def index
    current_user.releases
  end

  def puck
    @disable_player = true
    render "puck"
  end

  def new
    @release = current_user.releases.new
  end

  def create
    @release = current_user.releases.new
    permitted_params = release_params
    if @release.update(permitted_params)
      redirect_to edit_playlist_release_path(@playlist, @release), notice: "success", status: 422
    else
      render "new", status: 422
    end
  end

  def edit
    @release = current_user.releases.friendly.find(params[:id])
  end

  def update
    @release = current_user.releases.friendly.find(params[:id])
    permitted_params = release_params
    if @release.update(permitted_params)
      flash.now[:notice] = "updated"
      render "edit", status: 422
    else
      flash.now[:error] = @release.errors.full_messages.join(", ")
      render "edit", status: 422
    end

  end

  def destroy
    @release = current_user.releases.friendly.find(params[:id])
    @release.destroy
    redirect_to playlist_releases_path(@playlist)
  end

  def upload_puck_image
    uploaded_file = params[:file]
    blob = ActiveStorage::Blob.create_and_upload!(
      io: uploaded_file,
      filename: uploaded_file.original_filename,
      content_type: uploaded_file.content_type
    )
    
    render json: { 
      url: rails_blob_url(blob),
      id: blob.id
    }
  end

  private

  def find_playlist
    @playlist = Playlist
      .where(user_id: current_user.id)
      .or(Playlist.where(label_id: current_user.id))
      .friendly.find(params[:playlist_id])

    render status: :not_found and return if @playlist.blank?
  end

  def release_params
    params.require(:release).permit(
      :sleeve_color, :cover, :product_id,
      :title, :subtitle, :cover_color, :record_color, :template,
      :spotify, :bandcamp, :soundcloud, :apple_music, :tidal,
      :amazon_music, :youtube_music, :deezer, :pandora,
      release_sections_attributes: [
        :id, :title, :content, :_destroy, :subtitle, :tag, :position, :body
      ],
      release_playlists_attributes: [:id, :playlist_id, :position, :_destroy]
    )
  end

end
