class EventsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show]
  before_action :set_event, only: [:schedule, :team, :tickets, :streaming, :attendees, :recordings, :settings, :edit, :update]

  def index
    @q = Event.ransack(params[:q])
    @q.sorts = 'starts_at asc' if @q.sorts.empty?
    
    @events = @q.result(distinct: true)
      .published
      .upcoming
      .includes(:user)
      .with_attached_cover
      .page(params[:page]).per(12)

    @past_events = Event.published
      .past
      .includes(:user)
      .with_attached_cover
      .limit(6)

    respond_to do |format|
      format.html
      format.turbo_stream
      format.json
    end
  end

  def new
    @event = current_user.events.new
  end

  def show
    @event = Event.public_events.friendly.find(params[:id])
    
    respond_to do |format|
      format.html
      format.json
    end
  end

  def edit
    @section = params[:section]
    @event = current_user.events.friendly.find(params[:id])
    respond_to do |format|
      format.html
      format.json{render "show"}
    end
  end

  def create
    @event = current_user.events.new(event_params)
    if @event.save
      flash.now[:notice] = "yes!"
      redirect_to edit_event_path(@event)
    end
  end

  def update
    if params[:toggle_published].present?
      @event.toggle_published!
      flash.now[:notice] = "event #{@event.state}"
      render "toggle_published" and return
    end

    if @event.update(event_params)
      flash.now[:notice] = "yes!"
    end
  end

  def mine
    @tab = params[:tab] || "drafts"
    @events = case @tab
    when "all"
      current_user.events.page(params[:page]).per(10)
    when "drafts"
      current_user.events.drafts.page(params[:page]).per(10)
    when "published"
      current_user.events.published.page(params[:page]).per(10)
    when "manager"
      Event.joins(:event_hosts)
        .where(event_hosts: {user_id: current_user.id})
        .includes(:user)
        .page(params[:page]).per(10)
    else
      current_user.events.page(params[:page]).per(10)
    end
  end

  def search_attendees
    @attendees = @event.attendees
      .includes(:user, :ticket)
      .order(created_at: :desc)
      .page(params[:page])
      .per(20)

    if params[:query].present?
      @attendees = @attendees.joins(:user)
        .where("users.email ILIKE ? OR users.full_name ILIKE ?", 
          "%#{params[:query]}%", "%#{params[:query]}%")
    end

    if params[:status].present? && params[:status] != "all"
      @attendees = @attendees.where(status: params[:status])
    end

    respond_to do |format|
      format.json
    end
  end

  private

  def set_event
    @event = current_user.events.friendly.find(params[:id])
  end

  def event_params
    params.require(:event).permit(:title, :event_start, :event_ends,
      :timezone,
      :description, :venue, :age_requirement, :payment_gateway,
      :ticket_currency, :location, :lat, :lng, :country, :city, :province,
      :participant_label, :participant_description, :scheduling_label,
      :scheduling_description, :cover,
      event_schedules_attributes: [
        :id, :name, :_destroy, :start_date, :end_date, :schedule_type, :description,
        schedule_schedulings_attributes: [:id, :_destroy, :name, :start_date, :end_date, :short_description]
      ],
      event_tickets_attributes: [
        :id,
        :title, :_destroy, :show_sell_until,
        :price, :qty, :selling_start, :selling_end, :short_description,
        :show_after_sold_out, :hidden, :min_tickets_per_order,
        :max_tickets_per_order, :after_purchase_message,
        :sales_channel
      ])
  end
end
