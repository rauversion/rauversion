class EventsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show]
  before_action :set_owned_event, only: [:schedule, :team, :tickets, :streaming, :attendees, :recordings, :settings, :update]
  before_action :set_edit_event, only: [:edit, :editor, :preview]
  before_action :disable_footer, only: [:editor, :preview]

  def index
    @q = Event.ransack(params[:q])
    @q.sorts = 'starts_at asc' if @q.sorts.empty?
    
    # Only show public and published events in index
    @events = @q.result(distinct: true)
      .public_events
      .upcoming
      .includes(:user)
      .with_attached_cover
      .page(params[:page]).per(12)

    @past_events = Event.published
      .public_events
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
    # Handle both regular slugs and signed IDs for private events
    # Try to find by signed_id first, then fall back to regular lookup
    @event = nil
    
    # First, try to find by signed_id (for private event access)
    begin
      @event = Event.find_signed(params[:id], purpose: :private_event)
    rescue ActiveRecord::RecordNotFound, ActiveSupport::MessageVerifier::InvalidSignature => e
      # Not a valid signed_id, continue to regular lookup
      Rails.logger.debug "Signed ID lookup failed: #{e.message}" if params[:id].length > 50
    end
    
    # If not found via signed_id, try regular lookup
    unless @event
      begin
        @event = Event.published.friendly.find(params[:id])
        
        # Check if event is private
        if @event.private?
          # Allow access if user is the owner
          if user_signed_in? && @event.user == current_user
            # Owner can access their private event
          else
            # Non-owners need the signed link
            redirect_to events_path, alert: I18n.t('events.show.private_event_requires_link')
            return
          end
        end
      rescue ActiveRecord::RecordNotFound
        redirect_to events_path, alert: I18n.t('events.show.not_found')
        return
      end
    end
    
    # Ensure event is published (even if accessed via signed_id)
    # Use generic message to avoid leaking information about draft events
    unless @event.published?
      redirect_to events_path, alert: I18n.t('events.show.event_not_available')
      return
    end

    event_description = @event.description.presence || @event.title

    og_image_url = (@event.cover.attached? ? (@event.cover_url(:og) rescue nil) : nil)

    set_meta_tags(
      title: @event.title,
      description: event_description,
      og: {
        title: @event.title,
        description: event_description,
        image: og_image_url,
        type: 'event',
        site_name: 'Rauversion',
        url: event_url(@event)
      },
      twitter: {
        card: "summary_large_image",
        site: "@rauversion",
        title: @event.title,
        url: event_url(@event),
        description: event_description,
        image: og_image_url
      }
    )
    
    respond_to do |format|
      format.html
      format.json
    end
  end

  def edit
    @section = params[:section]
    respond_to do |format|
      format.html { render_blank }
      format.json do
        if event_owned_by_current_user?(@event)
          render "edit"
        else
          render json: { error: "Unauthorized" }, status: :unauthorized
        end
      end
    end
  end

  def editor
    render_blank
  end

  def preview
    render_blank
  end

  def create
    @event = current_user.events.new(event_params)
    if @event.save
      flash.now[:notice] = "yes!"
      respond_to do |format|
        format.html { redirect_to edit_event_path(@event) }
        format.json { render "show" }
      end
    else
      render "show"
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
    @tab = params[:tab] || "all"
    events_scope = case @tab
    when "all"
      all_accessible_events
    when "owned"
      owned_events
    when "drafts"
      owned_events.drafts
    when "published"
      owned_events.published
    when "manager"
      managed_events
    else
      all_accessible_events
    end

    @events = filter_mine_events(events_scope)
      .page(params[:page])
      .per(mine_events_per_page)

    respond_to do |format|
      format.html
      format.json
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

  def set_owned_event
    @event = current_user.events.friendly.find(params[:id])
  end

  def set_edit_event
    @event = Event.friendly.find(params[:id])
    raise ActiveRecord::RecordNotFound unless @event.can_access_backoffice?(current_user)
  end

  def event_owned_by_current_user?(event)
    event.user_id == current_user.id
  end

  def manager_for_event?(event)
    event.can_access_backoffice?(current_user)
  end

  def owned_events
    owned_events_scope.includes(:user).order(updated_at: :desc)
  end

  def managed_events
    managed_events_scope
      .includes(:user)
      .distinct
      .order(updated_at: :desc)
  end

  def all_accessible_events
    Event.where(id: owned_events_scope.select(:id))
      .or(Event.where(id: managed_events_scope.select(:id)))
      .includes(:user)
      .distinct
      .order(updated_at: :desc)
  end

  def owned_events_scope
    current_user.events
  end

  def managed_events_scope
    Event.joins(:event_hosts)
      .where(event_hosts: { user_id: current_user.id, access_role: EventHost::BACKOFFICE_ACCESS_ROLES })
  end

  def filter_mine_events(scope)
    raw_query = params[:q]

    query =
      if raw_query.is_a?(ActionController::Parameters) || raw_query.is_a?(Hash)
        raw_query[:title_or_description_cont].presence ||
          raw_query[:title_cont].presence ||
          raw_query[:term].presence
      else
        raw_query.presence
      end

    return scope if query.blank?

    scope.ransack(title_or_description_cont: query).result(distinct: true)
  end

  def mine_events_per_page
    return 10 unless request.format.json?

    requested_per_page = params[:per].to_i
    return 50 if requested_per_page <= 0

    [requested_per_page, 100].min
  end

  def event_params
    permitted = params.require(:event).permit(:title, :event_start, :event_ends,
      :timezone,
      :state,
      :visibility, 
      :registration_type, :allow_comments, :show_attendees, :show_remaining_tickets, :social_sharing, :require_login,
      :description, :venue, :age_requirement, :payment_gateway,
      :ticket_currency, :location, :lat, :lng, :country, :city, :province,
      :participant_label, :participant_description, :scheduling_label,
      :scheduling_description, :cover,
      :requires_shipping, :show_remaining_count,
      :ticket_currency, :hide_location_until_purchase,
      :site_mode,
      event_schedules_attributes: [
        :id, :name, :_destroy, :start_date, :end_date, :schedule_type, :description,
        schedule_schedulings_attributes: [:id, :_destroy, :name, :start_date, :end_date, :short_description]
      ],
      event_tickets_attributes: [
        :id,
        :title, :_destroy, :show_sell_until,
        :price, :qty, :selling_start, :selling_end, :short_description,
        :show_after_sold_out, :hidden, :min_tickets_per_order,
        :max_tickets_per_order, :max_tickets_per_user, :after_purchase_message,
        :pay_what_you_want, :minimum_price, :suggested_price,
        :requires_shipping, 
        :show_remaining_count, 
        :event_list_id,
        :disable_qr,
        :sales_channel,
        :requires_login
      ],
      site_pages: []
    )

    if params[:event]&.key?(:site_pages)
      permitted[:site_pages] = normalize_json_param(params[:event][:site_pages])
    end

    permitted
  end

  def normalize_json_param(value)
    case value
    when ActionController::Parameters
      value.to_unsafe_h.transform_values { |item| normalize_json_param(item) }
    when Array
      value.map { |item| normalize_json_param(item) }
    else
      value
    end
  end
end
