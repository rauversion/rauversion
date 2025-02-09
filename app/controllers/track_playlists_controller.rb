class TrackPlaylistsController < ApplicationController
  before_action :authenticate_user!
  before_action :find_track_playlist, only: [:destroy]

  def create
    @track_playlist = TrackPlaylist.new(build_params)
    
    respond_to do |format|
      if @track_playlist.save
        format.html
        format.json
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @track_playlist.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    respond_to do |format|
      if @track_playlist&.playlist&.user_id == current_user.id && @track_playlist.destroy
        format.html
        format.json
      else
        format.html { redirect_to @track_playlist&.playlist, alert: 'Unable to remove track from playlist.' }
        format.json { render json: { error: 'Unable to remove track from playlist' }, status: :unprocessable_entity }
      end
    end
  end

  private

  def build_params
    params.require(:track_playlist).permit(:id, :track_id, :playlist_id)
  end

  def find_track_playlist
    @track_playlist = TrackPlaylist.find_by(
      playlist_id: params[:id],
      track_id: params[:track_playlist][:track_id]
    )
  end
end
