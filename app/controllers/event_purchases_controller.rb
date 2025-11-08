class EventPurchasesController < ApplicationController
  before_action :authenticate_user!

  def new
    @event = Event.friendly.find(params[:event_id])

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

    @purchase = current_user.purchases.new
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
    @purchase = current_user.purchases.find(params[:id])
    render "show"
  end

  def create
    @event = Event.public_events.friendly.find(params[:event_id])

    # When a customer purchases a ticket for an event:
    customer = current_user

    @tickets = @event.available_tickets(Time.zone.now)
    @purchase = current_user.purchases.new(purchasable: @event)
    available_tickets_by_id = @tickets.index_by(&:id)
    selected_items = ticket_request_params.each_with_object([]) do |ticket_param, items|
      quantity = ticket_param[:quantity].to_i
      next if quantity <= 0

      ticket = available_tickets_by_id[ticket_param[:id].to_i]
      next unless ticket

      items << VirtualPurchasedItem.new(resource: ticket, quantity: quantity)
    end

    @purchase.virtual_purchased = selected_items

    case @event.payment_gateway 
    when "stripe", "none", nil then handle_stripe_session
    when "transbank" then handle_tbk_session
    else
      raise "No payment gateway available for this event"
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
    @purchase = current_user.purchases.find(params[:id])

    if params[:enc].present?
      decoded_purchase = Purchase.find_signed(CGI.unescape(params[:enc]))
      @purchase.complete_purchase! if decoded_purchase.id = @purchase.id
    end

    render "show"
  end

  def failure
    @event = Event.friendly.find(params[:event_id])
    @purchase = current_user.purchases.find(params[:id])
    render "show"
  end

  def handle_stripe_session
    ActiveRecord::Base.transaction do
      @purchase.store_items
      if @purchase.save
        provider = PaymentProviders::EventStripeProvider.new(
          event: @event,
          user: current_user,
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

  def ticket_request_params
    params.require(:tickets).map do |ticket_param|
      ticket_param.permit(:id, :quantity)
    end
  end
end
