module Api
  module Admin
    class BaseController < ApplicationController
      layout false

      before_action :ensure_admin!
      before_action :ensure_active_tenant_subscription!

      rescue_from ::Admin::ResourceRegistry::ResourceNotFound, with: :render_not_found

      private

      def ensure_admin!
        return render json: { error: "Unauthorized" }, status: :unauthorized if current_user.blank?
        return if platform_admin? || tenant_admin?

        render json: { error: "Forbidden" }, status: :forbidden
      end

      def platform_admin?
        current_user.admin? && Current.tenant.central?
      end

      def tenant_admin?
        Current.membership&.role.in?(%w[owner admin])
      end

      def ensure_active_tenant_subscription!
        return if platform_admin? || Current.tenant.access_policy.accessible?

        render json: {
          error: "Tenant subscription required",
          code: "tenant_subscription_required",
          billing_path: "/billing"
        }, status: :payment_required
      end

      def tenant_preview_url(tenant)
        if Rails.env.development?
          host = tenant.central? ? "lvh.me" : "#{tenant.slug}.lvh.me"
          "#{request.protocol}#{host}:#{request.port}"
        else
          base_domain = ENV.fetch("TENANT_BASE_DOMAIN", "rauversion.com")
          host = tenant.central? ? base_domain : "#{tenant.slug}.#{base_domain}"
          "https://#{host}"
        end
      end

      def tenant_admin_url(tenant)
        "#{tenant_preview_url(tenant)}/admin"
      end

      def render_not_found(error)
        render json: { error: error.message }, status: :not_found
      end
    end
  end
end
