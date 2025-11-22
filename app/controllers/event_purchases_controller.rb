class EventPurchasesController < ApplicationController
  before_action :authenticate_user!, except: [:new, :create,  :success, :failure]
  
  def new
    @event = find_event_for_purchase(params[:event_id])

    # When a customer purchases a ticket for an event:
    customer = current_user
    # ticket = EventTicket.find_by(id: ticket_id)

    # If ticket_token is provided, only show that specific hidden ticket
    if params[:ticket_token].present?
      begin
        ticket = EventTicket.find_signed(params[:ticket_token], purpose: :secret_purchase)
        # Verify the ticket belongs to this event
        if ticket && ticket.event_id == @event.id
          @tickets = [ticket]
        else
          @tickets = []
        end
      rescue ActiveSupport::MessageVerifier::InvalidSignature
        @tickets = []
      end
    else
      @tickets = @event.available_tickets(Time.zone.now)
    end

    if current_user
      @purchase = current_user.purchases.new
    else
      @purchase = Purchase.new
    end
    @purchase.virtual_purchased = @tickets.map do |aa|
      VirtualPurchasedItem.new({resource: aa, quantity: 1})
    end
    # if Purchase.is_ticket_valid?(ticket, current_user, desired_quantity)
    #  purchase = Purchase.create(customer: customer, purchased_item: ticket)
    # Add any additional logic related to the purchase (e.g., updating ticket quantity, calculating total_amount, etc.).
    # else
    # Handle the case where the ticket is not valid for purchase.
    # end
  end

  def show
    @event = Event.friendly.find(params[:event_id])
    if current_user
      @purchase = current_user.purchases.find(params[:id])
    else
      @purchase = Purchase.find(params[:id])
      # Security check: only allow access if the purchase belongs to the event
      unless @purchase.purchasable_id == @event.id && @purchase.purchasable_type == 'Event'
        redirect_to root_path, alert: "Purchase not found"
        return
      end
    end
    render "show"
  end

  def create
    # Try to find by signed_id first (for private event access), then fall back to regular lookup
    @event = find_event_for_purchase(params[:event_id])

    # Handle guest purchase or regular user purchase
    if current_user
      @customer = current_user
      @purchase = current_user.purchases.new(purchasable: @event)
    else
      # Guest purchase: validate and find or create user
      guest_email = params[:guest_email]
      
      if guest_email.blank?
        @purchase = Purchase.new(purchasable: @event)
        @purchase.errors.add(:guest_email, "is required for guest purchases")
        respond_to do |format|
          format.html { render_blank }
          format.json { render :create, status: :unprocessable_entity }
        end
        return
      end

      # Find or create user by email
      user = User.find_by(email: guest_email)
      
      if user
        # User exists, assign purchase to them
        @purchase = user.purchases.new(purchasable: @event, guest_email: guest_email)
      else
        # Create new user account with the email
        # Generate a random password and send confirmation email
        password = SecureRandom.hex(16)
        user = User.new(
          email: guest_email,
          password: password,
          password_confirmation: password,
          username: "user_#{SecureRandom.hex(4)}"
        )

        if user.save
          @purchase = user.purchases.new(purchasable: @event)
          @purchase.guest_email = guest_email
        else
          @purchase = Purchase.new(purchasable: @event, guest_email: guest_email)
          @purchase.errors.add(:guest_email, user.errors.full_messages.join(", "))
          respond_to do |format|
            format.html { render_blank }
            format.json { render :create, status: :unprocessable_entity }
          end
          return
        end
      end
      
      @customer = user
    end

    @tickets = @event.available_tickets(Time.zone.now)
    available_tickets_by_id = @tickets.index_by(&:id)
    
    # Get the email to validate against event lists
    validation_email = current_user ? current_user.email : params[:guest_email]
    
    selected_items = ticket_request_params.each_with_object([]) do |ticket_param, items|
      quantity = ticket_param[:quantity].to_i
      next if quantity <= 0

      ticket = available_tickets_by_id[ticket_param[:id].to_i]
      next unless ticket

      # Validate email against event list if ticket has one assigned
      unless ticket.can_redeem_with_email?(validation_email)
        @purchase = Purchase.new(purchasable: @event)
        @purchase.errors.add(:base, I18n.t('event_purchases.errors.email_not_in_list', ticket_title: ticket.title))
        respond_to do |format|
          format.html { render_blank }
          format.json { render :create, status: :unprocessable_entity }
        end
        return
      end

      # Validate requires_login setting
      if ticket.requires_login && !current_user
        @purchase = Purchase.new(purchasable: @event)
        @purchase.errors.add(:base, I18n.t('event_purchases.errors.requires_login', ticket_title: ticket.title))
        respond_to do |format|
          format.html { render_blank }
          format.json { render :create, status: :unprocessable_entity }
        end
        return
      end

      virtual_item_attrs = { resource: ticket, quantity: quantity }
      
      # For pay_what_you_want tickets, capture the custom price
      if ticket.pay_what_you_want? && ticket_param[:custom_price].present?
        custom_price = ticket_param[:custom_price].to_f
        # Validate minimum price
        minimum = ticket.minimum_price.to_f
        virtual_item_attrs[:custom_price] = [custom_price, minimum].max
      end
      
      items << VirtualPurchasedItem.new(virtual_item_attrs)
    end

    @purchase.virtual_purchased = selected_items

    # Check if mixing free and paid tickets
    has_free_tickets = @purchase.virtual_purchased.any? { |item| item.resource.price.to_f == 0 }
    has_paid_tickets = @purchase.virtual_purchased.any? { |item| item.resource.price.to_f > 0 }
    
    if has_free_tickets && has_paid_tickets
      @purchase.errors.add(:base, "No se pueden comprar tickets gratuitos junto con tickets de pago. Por favor, realiza compras separadas.")
      respond_to do |format|
        format.html { render_blank }
        format.json { render :create, status: :unprocessable_entity }
      end
      return
    end

    # Check if all tickets are free (total = 0)
    total_amount = calculate_purchase_total(@purchase)
    if total_amount == 0
      handle_free_purchase
    else
      case @event.payment_gateway 
      when "stripe", "none", nil then handle_stripe_session
      when "transbank" then handle_tbk_session
      else
        raise "No payment gateway available for this event"
      end
    end

    respond_to do |format|
      format.html {render_blank}
      format.json
    end

    #########

    # if Purchase.is_ticket_valid?(ticket, current_user, desired_quantity)
    #  purchase = Purchase.create(customer: customer, purchased_item: ticket)
    # Add any additional logic related to the purchase (e.g., updating ticket quantity, calculating total_amount, etc.).
    # else
    # Handle the case where the ticket is not valid for purchase.
    # end
  end

  def success
    @event = Event.friendly.find(params[:event_id])
    if current_user
      @purchase = current_user.purchases.find_signed(params[:id])
    else
      @purchase = Purchase.find_signed(params[:id])
    end

    if params[:enc].present?
      decoded_purchase = Purchase.find_signed(CGI.unescape(params[:enc]))
      @purchase.complete_purchase! if decoded_purchase.id = @purchase.id
    end

    render "show"
  end

  def failure
    @event = Event.friendly.find(params[:event_id])
    if current_user
      @purchase = current_user.purchases.find(params[:id])
    else
      @purchase = Purchase.find(params[:id])
    end
    render "show"
  end

  def handle_stripe_session
    ActiveRecord::Base.transaction do
      @purchase.store_items
      if @purchase.save
        provider = PaymentProviders::EventStripeProvider.new(
          event: @event,
          user: @customer || current_user,
          purchase: @purchase
        )

        result = provider.create_checkout_session

        if result[:error].present?
          @purchase.errors.add(:base, result[:error])
          raise ActiveRecord::Rollback
        end

        @payment_url = result[:checkout_url]
      end
    end
  end

  def handle_tbk_session
    ### TRANSBANK ###
    commerce_code = ENV["TBK_MALL_ID"]
    api_key = ENV["TBK_API_KEY"]

    @tx = Transbank::Webpay::WebpayPlus::MallTransaction.new(
      commerce_code,
      api_key,
      :integration
    )

    @ctrl = "webpay_plus_mall"

    ActiveRecord::Base.transaction do
      @purchase.store_items
      if @purchase.save
        # cancel_url:  failure_event_event_purchase_url(@event, @purchase)
        @details = [
          {
            "amount" => "1000",
            "commerce_code" => ::Transbank::Common::IntegrationCommerceCodes::WEBPAY_PLUS_MALL_CHILD1,
            "buy_order" => "childBuyOrder1_#{rand(1000)}"
          },
          {
            "amount" => "2000",
            "commerce_code" => ::Transbank::Common::IntegrationCommerceCodes::WEBPAY_PLUS_MALL_CHILD2,
            "buy_order" => "childBuyOrder2_#{rand(1000)}"
          }
        ]

        @buy_order = "buyOrder_#{rand(1000)}"
        @session_id = "sessionId_#{rand(1000)}"

        @purchase.update(
          checkout_type: "tbk",
          checkout_id: @session_id
        )

        @return_url = success_event_event_purchase_url(@event, @purchase, provider: "tbk", enc: @purchase.signed_id)

        @resp = @tx.create(@buy_order, @session_id, @return_url, @details)

        @payment_url = "#{@resp["url"]}?token_ws=#{@resp["token"]}"

      end
    end
  end

  private

  def calculate_purchase_total(purchase)
    purchase.virtual_purchased.sum do |virtual_item|
      # Use custom_price if available (for PWYW tickets), otherwise use resource price
      price = virtual_item.custom_price.present? ? virtual_item.custom_price : virtual_item.resource.price.to_f
      price * virtual_item.quantity
    end
  end

  def handle_free_purchase
    ActiveRecord::Base.transaction do
      @purchase.store_items
      
      if @purchase.save
        @purchase.price = 0
        @purchase.currency = @event.ticket_currency || "usd"
        @purchase.complete_purchase!
        # Don't set @payment_url - frontend will navigate to purchase page
      else
        raise ActiveRecord::Rollback
      end
    end
  end

  def ticket_request_params
    params.require(:tickets).map do |ticket_param|
      ticket_param.permit(:id, :quantity, :custom_price)
    end
  end

  def find_event_for_purchase(event_id)
    # Try to find by signed_id first for private event access
    begin
      event = Event.find_signed(event_id, purpose: :private_event)
      # Signed ID found - ensure the event is published
      if event&.published?
        return event
      else
        # Event found via signed_id but not published - deny access
        raise ActiveRecord::RecordNotFound, "Event not available"
      end
    rescue ActiveRecord::RecordNotFound, ActiveSupport::MessageVerifier::InvalidSignature
      # Not a valid signed_id, continue to regular lookup
    end
    
    # Fall back to regular lookup for public/unlisted events
    event = Event.published.friendly.find(event_id)
    
    # Check visibility - allow public and unlisted, but not private without signed_id
    if event.private?
      # Only allow if user is the owner
      if user_signed_in? && event.user == current_user
        return event
      else
        raise ActiveRecord::RecordNotFound, "Private event requires signed link"
      end
    end
    
    event
  end
end
