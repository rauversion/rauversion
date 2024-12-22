module UserLinks
  class WizardController < ApplicationController
    before_action :authenticate_user!
    before_action :set_user
    
    def new
      @link_types = UserLink.available_types
    end

    def create
      services_params = params.require(:services).permit!
      
      ActiveRecord::Base.transaction do
        services_params.each do |service_type, service_data|
          next if service_data[:username].blank? && service_data[:custom_url].blank?
          
          klass = "UserLinks::#{service_type.to_s.classify}Link".constantize
          attrs = service_data.to_h.symbolize_keys
          
          current_user.user_links.create!(attrs.merge(type: klass.name))
        end
      end

      redirect_to user_links_path(username: current_user.username), notice: 'Social media links were successfully configured.'
    rescue => e
      flash.now[:error] = e.message
      @link_types = UserLink.available_types
      render :new
    end

    private

    def set_user
      @user = current_user
    end
  end
end
