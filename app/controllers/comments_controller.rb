class CommentsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show]
  before_action :set_resource, only: [:index, :create]

  def index
    @comments = @resource.comments.includes(:user).page(params[:page]).per(10)
  end

  def create
    @comment = @resource.comments.new(comment_params)
    @comment.user = current_user

    if @comment.save
      render :create, status: :created
    else
      render json: { errors: @comment.errors }, status: :unprocessable_entity
    end
  end

  private

  def set_resource
    if params[:track_id]
      @resource = Track.friendly.find(params[:track_id])
    elsif params[:playlist_id]
      @resource = Playlist.friendly.find(params[:playlist_id])
    end
  end

  def comment_params
    params.require(:comment).permit(:body)
  end
end
