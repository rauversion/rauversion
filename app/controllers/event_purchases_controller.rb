class EventPurchasesController < ApplicationController
  before_action :authenticate_user!

  def new
    @event = Event.friendly.find(params[:event_id])

    # When a customer purchases a ticket for an event:
    customer = current_user
    # ticket = EventTicket.find_by(id: ticket_id)

    @tickets = @event.available_tickets(Time.zone.now)

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
    @purchase.virtual_purchased = @tickets.map do |aa|
      VirtualPurchasedItem.new({resource: aa, quantity: 1})
    end

    case @event.payment_gateway 
    when "stripe", "none" then handle_stripe_session
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
    # @purchase.errors.add(:base, "hahahaha")
    account = @event.user.oauth_credentials.find_by(provider: "stripe_connect")
    Stripe.stripe_account = account.uid

    ActiveRecord::Base.transaction do
      @purchase.store_items
      if @purchase.save
        line_items = @purchase.purchased_items.group(:purchased_item_id).count.map do |k, v|
          ticket = EventTicket.find(k)
          {
            "quantity" => v,
            "price_data" => {
              "unit_amount" => ((ticket.price * v) * 100).to_i,
              "currency" => ticket.event.ticket_currency,
              "product_data" => {
                "name" => ticket.title,
                "description" => "#{ticket.short_description} \r for event: #{ticket.event.title}"
              }
            }
          }
        end

        puts line_items

      
        total = line_items.map{|o| o["price_data"]["unit_amount"] }.sum

        @session = Stripe::Checkout::Session.create(
          payment_method_types: ["card"],
          line_items: line_items,
          payment_intent_data: {
            application_fee_amount: @purchase.calculate_fee(total, @event.ticket_currency).to_i
            # "transfer_data"=> %{
            #  "destination"=> c.uid
            # }
          },
          customer_email: current_user.email,
          mode: "payment",
          success_url: success_event_event_purchase_url(@event, @purchase), # Replace with your success URL
          cancel_url: failure_event_event_purchase_url(@event, @purchase)   # Replace with your cancel URL
        )

        @purchase.update(
          checkout_type: "stripe",
          checkout_id: @session["id"]
        )

        @payment_url = @session["url"]

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
end
