class UserFollowsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show]

  def followees
    @user = User.find_by(username: params[:user_id])
    @collection = @user.followees(User)
    render "index"
  end

  def followers
    @user = User.find_by(username: params[:user_id])
    @collection = @user.followers(User)
    render "index"
  end

  def create
    @user = User.find_by(username: params[:user_id])
    @is_following = current_user.toggle_follow!(@user)
    
    respond_to do |format|
      format.html do
        flash.now[:notice] = @is_following ? "Followed" : "Unfollowed"
        redirect_back(fallback_location: root_path)
      end
      
      format.json do
        render json: {
          is_following: @is_following,
          followers_count: @user.followers(User).count
        }
      end
    end
  end
end
