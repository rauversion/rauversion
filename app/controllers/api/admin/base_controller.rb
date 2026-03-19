module Api
  module Admin
    class BaseController < ApplicationController
      layout false

      before_action :ensure_admin!

      rescue_from ::Admin::ResourceRegistry::ResourceNotFound, with: :render_not_found

      private

      def ensure_admin!
        return render json: { error: "Unauthorized" }, status: :unauthorized if current_user.blank?
        return if current_user.admin?

        render json: { error: "Forbidden" }, status: :forbidden
      end

      def render_not_found(error)
        render json: { error: error.message }, status: :not_found
      end
    end
  end
end
