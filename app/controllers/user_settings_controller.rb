class UserSettingsController < ApplicationController
  before_action :authenticate_user!
  before_action :disable_footer

  def show
    @section = params[:section] || "profile"
    @user = current_user
    if @user.podcaster_info.blank? && params[:section] == "podcast"
      @user.build_podcaster_info
    end
    render "index"
  end

  def index
    @section = params[:section] || "profile"
    @user = current_user #User.find_by(username: params[:user_id])
  end

  def update
    @user = current_user
    @section = params[:section]
    @user.update(user_attributes)
    if @user.errors.blank?
      flash.now[:notice] = "#{params[:section]} updated"
    end
  end

  private

  def user_attributes
    params.require(:user).permit(
      :username,
      :hide_username_from_profile,
      :last_name, 
      :first_name, 
      :bio, :avatar, 
      :country, 
      :city,
      :email, :current_password,
      :new_follower_email,
      :new_follower_app,
      :repost_of_your_post_email,
      :repost_of_your_post_app,
      :new_post_by_followed_user_email,
      :new_post_by_followed_user_app,
      :like_and_plays_on_your_post_app,
      :comment_on_your_post_email,
      :comment_on_your_post_app,
      :suggested_content_email,
      :suggested_content_app,
      :new_message_email,
      :new_message_app,
      :profile_header,
      :like_and_plays_on_your_post_email,
      :tbk_commerce_code, :pst_enabled, :tbk_test_mode,
      podcaster_info_attributes: [
        :title, :about, :description, :avatar, :id,
        :spotify_url, :apple_podcasts_url, :google_podcasts_url, :stitcher_url, :overcast_url, :pocket_casts_url
      ]
    )
  end
end
