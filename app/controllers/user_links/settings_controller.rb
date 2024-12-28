module UserLinks
  class SettingsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_user

    def edit
    end

    def update
      if @user.update(settings_params)
        redirect_to edit_user_user_links_settings_path(user_id: current_user.username), 
          notice: 'Settings were successfully updated.'
      else
        render :edit, status: :unprocessable_entity
      end
    end

    private

    def set_user
      @user = User.find_by!(username: params[:user_id])
      authorize! :manage, @user
    end

    def settings_params
      params.require(:user).permit(
        :mailing_list_provider,
        :mailing_list_api_key,
        :mailing_list_list_id,
        :google_analytics_id,
        :facebook_pixel_id,
        :seo_title,
        :seo_description,
        :sensitive_content,
        :age_restriction
      )
    end
  end
end
