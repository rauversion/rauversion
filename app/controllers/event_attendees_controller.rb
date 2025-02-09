class EventAttendeesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_event

  def index
    @purchased_items = @event.purchased_items
                            .includes(purchased_item: [:user, :event_ticket])
                            .order(created_at: :desc)
                            .page(params[:page])
                            .per(20)

    respond_to do |format|
      format.json
    end
  end

  private

  def set_event
    @event = Event.find_by!(slug: params[:event_id])
  end
end
