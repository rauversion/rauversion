class EventTicketsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show]

  def show
    @purchased_item = PurchasedItem.find_signed(params[:id])
    @ticket = @purchased_item.purchased_item
    @purchase = @purchased_item.purchase
    @event = @purchase.purchasable
    @is_manager = @event.user_id == current_user.id || event_managers.includes?(current_user)
  end

  def update
    @purchased_item = PurchasedItem.find_signed(params[:id])
    @ticket = @purchased_item.purchased_item
    @purchase = @purchased_item.purchase
    @event = @purchase.purchasable
    @is_manager = @event.user_id == current_user.id || event_managers.includes?(current_user)
    @purchased_item.toggle_check_in!

    respond_to do |format|
      format.html { render "update" }
      format.json { render "show" }
    end
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
  def event_managers
    @event.event_hosts.where(event_manager: true)
  end
end
