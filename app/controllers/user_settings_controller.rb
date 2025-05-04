class UserSettingsController < ApplicationController
  before_action :authenticate_user!
  before_action :disable_footer
  before_action :set_user

  def show
    @section = params[:section] || "profile"
    if @user.podcaster_info.blank? && params[:section] == "podcast"
      @user.build_podcaster_info
    end
    render_blank
  end

  def index
    @section = params[:section] || "profile"
    respond_to do |format|
      format.html { render_blank }
      format.json
    end
  end

  def update
    @section = params[:section]

    respond_to do |format|
      if update_user
        format.json { render :update }
      else
        format.json { render json: { errors: @user.errors.messages }, status: :unprocessable_entity }
      end
    end
  end

  def podcast
    respond_to do |format|
      if update_user
        format.json { render :update }
      else
        format.json { render json: { errors: @user.errors.messages }, status: :unprocessable_entity }
      end
    end
  end

  def social_links
    respond_to do |format|
      if update_user
        format.json { render :update }
      else
        format.json { render json: { errors: @user.errors.messages }, status: :unprocessable_entity }
      end
    end
  end

  private

  def set_user
    @user = current_user
  end

  def update_user
    @user.update(user_attributes)
  end

  def user_attributes
    attrs = params.require(:user).permit(
      :username,
      :email,
      :first_name,
      :last_name,
      :country,
      :city,
      :bio,
      :current_password,
      :avatar,
      :avatar_blob_id,
      :profile_header,
      :profile_header_blob_id,
      :page_title,
      :page_description,
      :google_analytics_id,
      :facebook_pixel,
      :mailing_list_subscription,
      :display_sensitive_content,
      :age_restriction,
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
      :like_and_plays_on_your_post_email,
      podcaster_info_attributes: [
        :id,
        :title, :about, :description, :avatar, :active,
        :spotify_url, :apple_podcasts_url, :google_podcasts_url, :stitcher_url, :overcast_url, :pocket_casts_url,
        podcaster_hosts_ids: []
      ]
    )

    if attrs[:current_password].present?
      attrs
    else
      attrs.except(:email, :current_password)
    end
  end

  def podcaster_info_params
    params.require(:podcaster_info).permit(
      :title, :description, :category, :language, :explicit,
      :owner_name, :owner_email, :author, :avatar,
      :spotify_url, :apple_podcasts_url, :google_podcasts_url,
      :stitcher_url, :overcast_url, :pocket_casts_url,
      podcaster_hosts_ids: []
    )
  end
end
