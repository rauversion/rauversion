module Api
  module V1
    class TrackAnalysesController < ApplicationController
      def create
        return render_authentication_error unless current_user and current_user.is_admin?

        return render json: { error: "track_id is required" }, status: :unprocessable_entity if params[:track_id].blank?

        render json: TrackAudioAnalysisService.new(
          track: current_user.tracks.find(params[:track_id]),
          start_seconds: params[:start_seconds],
          duration_seconds: params[:duration_seconds],
          persist: persist_requested?
        ).call
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Track not found" }, status: :not_found
      rescue TrackAudioAnalysisService::Error => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def render_authentication_error
        render json: { error: "Authentication required" }, status: :unauthorized
      end

      def persist_requested?
        ActiveModel::Type::Boolean.new.cast(params[:persist] || params[:perist])
      end
    end
  end
end
