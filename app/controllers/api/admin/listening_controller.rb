module Api
  module Admin
    class ListeningController < BaseController
      def show
        render json: ::Admin::ListeningDashboard.new(
          from: params[:from],
          to: params[:to]
        ).as_json
      end
    end
  end
end
