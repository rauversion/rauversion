module Api
  module Admin
    class EventSalesController < BaseController
      def show
        render json: ::Admin::EventSalesDashboard.new(
          from: params[:from],
          to: params[:to]
        ).as_json
      end
    end
  end
end
