class EventTicketsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show]

  def show
    @purchased_item = PurchasedItem.find_signed(params[:id])
    @ticket = @purchased_item.purchased_item
    @purchase = @purchased_item.purchase
    @event = @purchase.purchasable
    @is_manager = @event.user_id == current_user.id || @event.managers.includes?(current_user)
  end

  def update
    @purchased_item = PurchasedItem.find_signed(params[:id])
    @ticket = @purchased_item.purchased_item
    @purchase = @purchased_item.purchase
    @event = @purchase.purchasable
    @is_manager = @event.user_id == current_user.id || @event.managers.includes?(current_user)
    @purchased_item.toggle_check_in!

    respond_to do |format|
      format.html { render "update" }
      format.json { render "show" }
    end
  end
end
