module Api
  module Admin
    class DashboardController < BaseController
      def show
        render json: ::Admin::CommerceDashboard.new.as_json
      end
    end
  end
end
