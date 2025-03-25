module Api
  module V1
    class UserLinksController < ApplicationController
      before_action :authenticate_user!, except: [:index]
      before_action :set_user_link, only: [:update, :destroy]
      
      def index
        @user = User.find_by!(username: params[:user_id])
        @user_links = @user.user_links.page(params[:page]).per(10)
      end

      def create
        @user_link = current_user.user_links.new(user_link_params)
        @user_link.type = "UserLinks::WebsiteLink"

        if @user_link.save
          render :create
        else
          render json: { error: @user_link.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def update
        if @user_link.update(user_link_params)
          render :update
        else
          render json: { error: @user_link.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def destroy
        if @user_link.destroy
          render :destroy
        else
          render json: { error: "Failed to delete link" }, status: :unprocessable_entity
        end
      end

      def wizard
        if params[:services].blank?
          render json: { error: "Please select at least one service" }, status: :unprocessable_entity
          return
        end

        ActiveRecord::Base.transaction do
          # Remove existing social media links
          current_user.user_links.where.not(type: "UserLinks::WebsiteLink").destroy_all

          # Create new links for each service
          params[:services].each do |service, attrs|
            next if attrs.values.all?(&:blank?) # Skip if all values are blank

            klass = "UserLinks::#{service.to_s.classify}Link".constantize
            current_user.user_links.create!(
              type: klass.name,
              username: attrs[:username],
              custom_url: attrs[:custom_url],
              title: attrs[:title].presence || klass.new.default_title
            )
          end
        end

        render json: { message: "Social media links were successfully configured." }
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def wizard_params
        params.require(:services).permit!
      end

      def set_user_link
        @user_link = current_user.user_links.find(params[:id])
      end

      def user_link_params
        params.require(:user_links_website_link).permit(
          :title, 
          :type,
          :username,
          :title, 
          :id,
          :url,
          :position,
          :custom_url
        )
      end
    end
  end
end
