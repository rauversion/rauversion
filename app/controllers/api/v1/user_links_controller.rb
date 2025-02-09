module Api
  module V1
    class UserLinksController < ApplicationController
      def index
        @user = User.find_by!(username: params[:user_username])
        @user_links = @user.user_links
      end
    end
  end
end
