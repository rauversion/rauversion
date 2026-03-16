class EventTicketsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show]
  before_action :set_ticket_context, only: [:show, :update]
  before_action :authorize_manager!, only: [:update]

  def show
    @is_manager = manager_for_event?
  end

  def update
    unless params.key?(:checked_in)
      return render_check_in_error("checked_in parameter is required")
    end

    @is_manager = true
    @purchased_item.set_checked_in!(params[:checked_in])

    respond_to do |format|
      format.html { render "update" }
      format.json { render "show" }
    end
  rescue PurchasedItem::CheckInError => e
    render_check_in_error(e.message)
  end

  def secret_link
    @event = Event.friendly.find(params[:event_id])
    @ticket = @event.event_tickets.find(params[:id])
    
    # Verify user is the event owner
    unless @event.user_id == current_user.id
      render json: { error: "Unauthorized" }, status: :unauthorized
      return
    end

    render json: { secret_url: @event.secret_ticket_url(@ticket) }
  end

  private

  def set_ticket_context
    @purchased_item = PurchasedItem.find_signed(params[:id])
    @ticket = @purchased_item.purchased_item
    @purchase = @purchased_item.purchase
    @event = @purchase.purchasable
  end

  def authorize_manager!
    return if manager_for_event?

    respond_to do |format|
      format.html { redirect_to root_path, alert: "Unauthorized" }
      format.json { render json: { error: "Unauthorized" }, status: :unauthorized }
    end
  end

  def manager_for_event?
    current_user.present? && (@event.user_id == current_user.id || event_managers.include?(current_user.id))
  end

  def render_check_in_error(message)
    respond_to do |format|
      format.html { redirect_to event_event_ticket_path(@event, @purchased_item.signed_id), alert: message }
      format.json { render json: { errors: [message] }, status: :unprocessable_entity }
    end
  end

  def event_managers
    @event.event_hosts.where(event_manager: true).pluck(:user_id)
  end
end
