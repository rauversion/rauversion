class EventAttendeesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_event

  def index
    @purchased_items = @event.purchased_items
                            .includes(purchase: :user, purchased_item: :event_ticket)
                            .order(created_at: :desc)

    # Filter by status if provided
    if params[:status].present? && params[:status] != 'all'
      @purchased_items = @purchased_items.where(state: params[:status])
    end

    @purchased_items = @purchased_items.page(params[:page]).per(20)

    respond_to do |format|
      format.json
    end
  end

  def export_csv
    EventAttendeesCsvExportJob.perform_later(@event.id, current_user.id)
    
    respond_to do |format|
      format.json { render json: { message: 'CSV export will be sent to your email shortly' }, status: :ok }
    end
  end

  def tickets
    @tickets = @event.event_tickets
    respond_to do |format|
      format.json { render json: { collection: @tickets } }
    end
  end

  def create_invitation
    email = params[:email]
    ticket_id = params[:ticket_id]

    # Find or create user
    user = User.find_by(email: email)
    if user.nil?
      # Create new user with temporary password
      password = SecureRandom.hex(16)
      user = User.new(
        email: email,
        username: email.split('@').first,
        password: password,
        password_confirmation: password
      )
      user.skip_confirmation!
      user.save!
    end

    # Find the ticket
    ticket = @event.event_tickets.find(ticket_id)

    # Create purchase
    purchase = Purchase.new(
      user: user,
      purchasable: @event,
      state: 'pending'
    )

    # Create purchased item
    purchase.purchased_items.build(
      purchased_item: ticket,
      state: 'pending'
    )

    if purchase.save
      render json: { 
        message: 'Invitation created successfully',
        purchase: purchase
      }, status: :created
    else
      render json: { 
        errors: purchase.errors.full_messages 
      }, status: :unprocessable_entity
    end
  end

  private

  def set_event
    @event = Event.find_by!(slug: params[:event_id])
  end
end
