class EventAttendeesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_event
  before_action :authorize_event_owner!, only: [:export_csv, :create_invitation]

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

    # Validate parameters
    if email.blank? || ticket_id.blank?
      return render json: { 
        errors: ['Email and ticket are required'] 
      }, status: :unprocessable_entity
    end

    # Find or create user
    user = User.find_by(email: email)
    if user.nil?
      # Create new user with temporary password
      password = SecureRandom.hex(16)
      # Generate unique username from email
      base_username = email.split('@').first.parameterize
      username = base_username
      counter = 1
      while User.exists?(username: username)
        username = "#{base_username}#{counter}"
        counter += 1
      end
      
      user = User.new(
        email: email,
        username: username,
        password: password,
        password_confirmation: password
      )
      user.skip_confirmation!
      
      unless user.save
        return render json: { 
          errors: user.errors.full_messages 
        }, status: :unprocessable_entity
      end
    end

    # Find the ticket
    begin
      ticket = @event.event_tickets.find(ticket_id)
    rescue ActiveRecord::RecordNotFound
      return render json: { 
        errors: ['Ticket not found'] 
      }, status: :not_found
    end

    # Create purchase
    purchase = Purchase.new(
      user: user,
      purchasable: @event,
      state: 'pending',
      price: ticket.price,
      currency: @event.ticket_currency
    )

    # Create purchased item
    purchase.purchased_items.build(
      purchased_item: ticket,
      state: 'pending'
    )

    if purchase.save
      purchase.complete_purchase!
      render json: { 
        message: 'Invitation created successfully',
        purchase: purchase
      }, status: :created
    else
      render json: { 
        errors: purchase.errors.full_messages 
      }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("Error creating invitation: #{e.message}")
    render json: { 
      errors: ['An error occurred while creating the invitation'] 
    }, status: :internal_server_error
  end

  private

  def set_event
    @event = Event.find_by!(slug: params[:event_id])
  end

  def authorize_event_owner!
    unless @event.user_id == current_user.id
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  end
end
