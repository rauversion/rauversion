module Api
  module V1
    class MeController < ApplicationController
      # before_action :authenticate_user!

      def show
      end

      def music_library
        return render_authentication_error unless current_user

        render json: MusicLibraryQuery.new(
          user: current_user,
          filter: params[:filter],
          sort: params[:sort],
          page: params[:page],
          per: params[:per]
        ).call
      end

      def liked_tracks
        return render_authentication_error unless current_user

        render json: LikedTracksQuery.new(
          user: current_user,
          page: params[:page],
          per: params[:per]
        ).call
      end

      private

      def render_authentication_error
        render json: { error: "Authentication required" }, status: :unauthorized
      end
    end
  end
end
