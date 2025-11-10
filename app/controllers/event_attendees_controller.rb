class EventAttendeesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_event
  before_action :authorize_event_owner!, only: [:export_csv, :create_invitation, :refund]

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

  def refund
    purchased_item = PurchasedItem.find(params[:id])
    
    # Verify the purchased item belongs to this event
    unless purchased_item.purchased_item_type == 'EventTicket' && 
           purchased_item.purchased_item.event_id == @event.id
      return render json: { 
        errors: ['Purchased item not found or does not belong to this event'] 
      }, status: :not_found
    end

    # Check if already refunded
    if purchased_item.refunded?
      return render json: { 
        errors: ['This ticket has already been refunded'] 
      }, status: :unprocessable_entity
    end

    # Check if ticket is paid
    unless purchased_item.paid?
      return render json: { 
        errors: ['Only paid tickets can be refunded'] 
      }, status: :unprocessable_entity
    end

    purchase = purchased_item.purchase
    
    # Process refund via Stripe
    begin
      # Only process Stripe refund if payment was via Stripe
      if purchase.checkout_type == 'stripe' && purchase.checkout_id.present?
        stripe_session = Stripe::Checkout::Session.retrieve(purchase.checkout_id)
        payment_intent_id = stripe_session.payment_intent
        
        if payment_intent_id.present?
          # Calculate refund amount (price per ticket)
          # Consider the event's ticket_currency for proper amount calculation
          ticket_price = purchased_item.purchased_item.price
          currency = purchase.currency || @event.ticket_currency || "usd"
          
          # For CLP and zero-decimal currencies, use the amount as-is
          # For other currencies like USD, convert to cents (smallest unit)
          refund_amount = case currency.downcase
          when "clp", "jpy", "krw"  # Zero-decimal currencies
            ticket_price.to_i
          else
            (ticket_price * 100).to_i
          end
          
          stripe_refund = Stripe::Refund.create({
            payment_intent: payment_intent_id,
            amount: refund_amount
          })
          
          # Update purchased item with refund information
          purchased_item.refund!
          purchased_item.update(
            refunded_at: Time.current,
            refund_id: stripe_refund.id
          )
          
          # Increment ticket quantity back
          ticket = purchased_item.purchased_item
          ticket.increment!(:qty)
          
          render json: { 
            message: 'Refund processed successfully',
            purchased_item: purchased_item
          }, status: :ok
        else
          render json: { 
            errors: ['Payment intent not found'] 
          }, status: :unprocessable_entity
        end
      else
        # For non-Stripe payments or invitations, just mark as refunded
        purchased_item.refund!
        purchased_item.update(refunded_at: Time.current)
        
        # Increment ticket quantity back
        ticket = purchased_item.purchased_item
        ticket.increment!(:qty)
        
        render json: { 
          message: 'Ticket refunded successfully',
          purchased_item: purchased_item
        }, status: :ok
      end
    rescue Stripe::StripeError => e
      Rails.logger.error("Stripe refund error: #{e.message}")
      render json: { 
        errors: ["Refund failed: #{e.message}"] 
      }, status: :unprocessable_entity
    rescue StandardError => e
      Rails.logger.error("Refund error: #{e.message}")
      render json: { 
        errors: ['An error occurred while processing the refund'] 
      }, status: :internal_server_error
    end
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
