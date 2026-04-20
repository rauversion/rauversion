module Newsletter
  class TrackingController < ActionController::Base
    layout false
    protect_from_forgery with: :null_session

    def open
      Newsletter::BroadcastTracking.record_open!(token: params[:token], request: request)

      response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
      response.headers["Pragma"] = "no-cache"
      send_data Newsletter::BroadcastTracking.transparent_pixel, type: "image/gif", disposition: "inline"
    rescue Newsletter::BroadcastTracking::InvalidToken
      head :not_found
    end

    def click
      redirect_to Newsletter::BroadcastTracking.record_click!(token: params[:token], request: request), allow_other_host: true
    rescue Newsletter::BroadcastTracking::InvalidToken, ActionController::Redirecting::UnsafeRedirectError, ArgumentError
      head :not_found
    end
  end
end
