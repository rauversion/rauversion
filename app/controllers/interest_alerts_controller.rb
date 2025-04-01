class InterestAlertsController < ApplicationController
  before_action :authenticate_user!

  def status
    @interest_alert = current_user.interest_alerts.find_by(role: params[:role])
    render json: {
      has_pending_request: @interest_alert.present?,
      approved: @interest_alert&.approved || false
    }
  end

  def create
    @interest_alert = current_user.interest_alerts.new(interest_alert_params)
    
    if @interest_alert.save
      render :create
    else
      render json: { errors: @interest_alert.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def interest_alert_params
    params.require(:interest_alert).permit(:role, :body)
  end
end
