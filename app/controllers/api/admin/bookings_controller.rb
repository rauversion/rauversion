module Api
  module Admin
    class BookingsController < BaseController
      def show
        render json: ::Admin::BookingsDashboard.new(
          from: params[:from],
          to: params[:to]
        ).as_json
      end
    end
  end
end
