class PodcastsController < ApplicationController

  before_action :find_user
  before_action :unset_user_menu
  before_action :disable_footer
  before_action :get_pocaster_info

  def index
    # Get user's podcasts and podcasts from hosts they're associated with
    host_ids = @podcaster_info&.hosts&.pluck(:id) || []
    @collection = Track.published.podcasts
                      .where(user_id: [host_ids + [@user.id]].flatten)
                      .page(params[:page])
                      .per(10)
  end

  def show
    host_ids = @podcaster_info&.hosts&.pluck(:id) || []
    @podcast = Track.published.podcasts
                      .where(user_id: [host_ids + [@user.id]].flatten)
                      .friendly.find(params[:id])
  end

  def about
  end

  private

  def get_pocaster_info
    @podcaster_info = @user.podcaster_info
    unless @podcaster_info.active?
      render "errors/404" and return
    end
  end

  def unset_user_menu
    @disable_user_menu = true
  end

  def find_user
    @user = User.find_by(username: params[:user_id])
  end

  def podcaster_params
    params.require(:podcaster_info).permit(:about, :title, :description)
  end
end
