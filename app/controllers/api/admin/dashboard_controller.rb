module Api
  module Admin
    class DashboardController < BaseController
      def show
        scope = if platform_admin?
          ProductPurchase.all
        else
          ProductPurchase.where(
            id: ProductPurchaseItem
              .joins(:product)
              .where(products: { tenant_id: Current.tenant.id })
              .select(:product_purchase_id)
          )
        end

        render json: ::Admin::CommerceDashboard.new(scope: scope).as_json
      end
    end
  end
end
