module Api
  module Admin
    class MetaController < BaseController
      skip_before_action :ensure_active_tenant_subscription!

      def show
        manageable_memberships = current_user.memberships
          .includes(:tenant)
          .where(role: %w[owner admin])
          .sort_by { |membership| [membership.tenant.central? ? 0 : 1, membership.tenant.name.downcase] }

        render json: {
          navigation: navigation,
          context: {
            tenant: {
              id: Current.tenant.id,
              name: Current.tenant.name,
              slug: Current.tenant.slug,
              central: Current.tenant.central?,
              role: Current.membership&.role,
              preview_url: tenant_preview_url(Current.tenant),
              admin_url: tenant_admin_url(Current.tenant),
              settings_path: "/tenants/#{Current.tenant.id}/settings"
            },
            platform_admin: platform_admin?,
            subscription_accessible: Current.tenant.access_policy.accessible?,
            billing_path: "/billing",
            available_tenants: manageable_memberships.map do |membership|
              {
                id: membership.tenant.id,
                name: membership.tenant.name,
                slug: membership.tenant.slug,
                role: membership.role,
                admin_url: tenant_admin_url(membership.tenant)
              }
            end
          }
        }
      end

      private

      def navigation
        items = ::Admin::ResourceRegistry.nav_items(platform_admin: platform_admin?)
        items << {
          key: "tenant_settings",
          label: "Appearance",
          kind: "resource",
          icon: "Settings2",
          path: "/tenants/#{Current.tenant.id}/settings"
        }
        items << {
          key: "tenant_billing",
          label: "Billing",
          kind: "resource",
          icon: "CreditCard",
          path: "/billing"
        }
        items
      end
    end
  end
end
