class LikesController < ApplicationController
  before_action :check_user
  respond_to :json

  def create
    @resource = find_resource
    @liked = current_user.toggle_like!(@resource)
    
    respond_to do |format|
      format.json { render :show }
    end
  end

  private

  def find_resource
    if params[:track_id]
      @resource = Track.friendly.find(params[:track_id])
    elsif params[:playlist_id]
      @resource = Playlist.friendly.find(params[:playlist_id])
    end
  end

  def check_user
    unless current_user
      respond_to do |format|
        format.json { render json: { error: "Authentication required" }, status: :unauthorized }
      end
    end
  end
end
