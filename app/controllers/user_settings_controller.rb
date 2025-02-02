class UserSettingsController < ApplicationController
  before_action :authenticate_user!
  before_action :disable_footer
  before_action :set_user

  def show
    @section = params[:section] || "profile"
    if @user.podcaster_info.blank? && params[:section] == "podcast"
      @user.build_podcaster_info
    end
    render "index"
  end

  def index
    @section = params[:section] || "profile"
    respond_to do |format|
      format.html
      format.json
    end
  end

  def update
    @section = params[:section]


    # Handle cover attachment if blob_id is present
    if params.dig(:post, :avatar_blob_id).present?
      @user.avatar.attach(params[:post][:avatar_blob_id])
      
      # Handle crop data if present
      #if params.dig(:post, :crop_data).present?
      #  @user.update(crop_data: params[:post][:crop_data])
      #end
    end

    # Handle cover attachment if blob_id is present
    if params.dig(:post, :profile_header_blob_id).present?
      @user.profile_header.attach(params[:post][:profile_header_blob_id])
      
      # Handle crop data if present
      #if params.dig(:post, :crop_data).present?
      #  @user.update(crop_data: params[:post][:crop_data])
      #end
    end

    respond_to do |format|
      if @user.update(user_attributes)
        format.html { flash.now[:notice] = "#{params[:section]} updated" }
        format.json
      else
        format.html
        format.json { render :update, status: :unprocessable_entity }
      end
    end
  end

  private

  def set_user
    @user = current_user
  end

  def user_attributes
    attrs = params.require(:user).permit(
      :username,
      :first_name,
      :last_name,
      :bio,
      :country,
      :city,
      :website,
      :hide_username_from_profile,
      :avatar_blob_id,
      :profile_header_blob_id,
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
      :like_and_plays_on_your_post_email,
      :tbk_commerce_code, :pst_enabled, :tbk_test_mode,
      
      :mailing_list_provider,
      :mailing_list_api_key,
      :mailing_list_list_id,
      :email_sign_up,
      :google_analytics_id,
      :facebook_pixel_id,
      :social_title,
      :social_description,
      :sensitive_content,
      :age_restriction,
      
      podcaster_info_attributes: [
        :title, :about, :description, :avatar, :id,
        :active,
        :spotify_url, :apple_podcasts_url, :google_podcasts_url, :stitcher_url, :overcast_url, :pocket_casts_url,
        podcaster_hosts_ids: []
      ]
      
    )

    # Attach blobs if provided
    if attrs[:avatar_blob_id].present?
      attrs[:avatar] = ActiveStorage::Blob.find_signed(attrs.delete(:avatar_blob_id))
    end

    if attrs[:profile_header_blob_id].present?
      attrs[:profile_header] = ActiveStorage::Blob.find_signed(attrs.delete(:profile_header_blob_id))
    end

    attrs
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
