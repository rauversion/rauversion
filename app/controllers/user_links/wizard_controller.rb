module UserLinks
  class WizardController < ApplicationController
    before_action :authenticate_user!
    before_action :set_user
    
    def new
      @link_types = UserLink.available_types
      render :choose_services, status: :unprocessable_entity
    end

    def configure
      @selected_services = params[:services]&.select { |_, v| v == "1" }&.keys || []
      
      if @selected_services.empty?
        flash.now[:error] = "Please select at least one service"
        @link_types = UserLink.available_types
        render :choose_services, status: :unprocessable_entity
        return
      end

      # Build user_links objects for the selected services
      @selected_services.each do |service|
        klass = "UserLinks::#{service.to_s.classify}Link".constantize
        current_user.user_links.build(type: klass.name)
      end

      render :configure_services, status: :unprocessable_entity
    end

    def create
      if current_user.update(user_params)
        redirect_to user_user_links_path(username: current_user.username), 
          notice: 'Social media links were successfully configured.'
      else
        flash.now[:error] = current_user.errors.full_messages.to_sentence
        render :configure_services, status: :unprocessable_entity
      end
    end

    private

    def set_user
      @user = current_user
    end

    def user_params
      params.require(:user).permit(
        user_links_attributes: [:type, :username, :custom_url, :title]
      )
    end
  end
end
