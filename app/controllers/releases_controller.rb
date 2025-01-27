class ReleasesController < ApplicationController
  before_action :find_playlist

  def index
    @playlist.releases
  end

  def new
    @release = @playlist.releases.new
  end

  def create
    @release = @playlist.releases.new
    permitted_params = release_params
    if @release.update(permitted_params)
      redirect_to edit_playlist_release_path(@playlist, @release), notice: "success", status: 422
    else
      render "new", status: 422
    end
  end

  def edit
    @release = @playlist.releases.friendly.find(params[:id])
  end

  def update
    @release = @playlist.releases.friendly.find(params[:id])
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
    @release = @playlist.releases.friendly.find(params[:id])
    @release.destroy
    redirect_to playlist_releases_path(@playlist)
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
