module Api
  module Admin
    class EventSalesController < BaseController
      def show
        event_scope = platform_admin? ? Event.all : Event.where(tenant_id: Current.tenant.id)
        purchase_ids = Purchase
          .where(purchasable_type: "Event", purchasable_id: event_scope.select(:id))
          .select(:id)
        scope = PurchasedItem.where(purchased_item_type: "EventTicket", purchase_id: purchase_ids)

        render json: ::Admin::EventSalesDashboard.new(
          scope: scope,
          event_scope: event_scope,
          from: params[:from],
          to: params[:to]
        ).as_json
      end
    end
  end
end
