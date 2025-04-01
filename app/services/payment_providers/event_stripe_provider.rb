module PaymentProviders
  class EventStripeProvider < BaseProvider
    attr_reader :event, :purchase

    def initialize(event:, user:, purchase:)
      @event = event
      super(user: user, purchase: purchase, cart: nil)
    end

    def create_checkout_session
      return { error: "No tickets selected" } unless validate_purchase!
      
      connected_account_id = event.user.stripe_account_id
      checkout_params = build_checkout_params(connected_account_id)

      begin
        session = Stripe::Checkout::Session.create(checkout_params)
        
        purchase.update(
          checkout_type: "stripe",
          checkout_id: session.id
        )

        { checkout_url: session.url }
      rescue Stripe::InvalidRequestError => e
        { error: e.message }
      end
    end

    private

    def validate_purchase!
      purchase.purchased_items.any?
    end

    def build_checkout_params(connected_account_id)
      line_items = build_line_items
      total = calculate_total(line_items)

      {
        payment_method_types: ["card"],
        line_items: line_items,
        payment_intent_data: {
          application_fee_amount: calculate_fee(total),
          transfer_data: {
            destination: connected_account_id
          }
        },
        customer_email: user.email,
        mode: "payment",
        success_url: success_url,
        cancel_url: cancel_url,
        metadata: {
          source_type: "event"
        }
      }
    end

    def build_line_items
      purchase.purchased_items.group(:purchased_item_id).count.map do |k, v|
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
    end

    def calculate_total(line_items)
      line_items.sum { |item| item["price_data"]["unit_amount"] }
    end

    def calculate_fee(total)
      fee_percentage = ENV.fetch('PLATFORM_EVENTS_FEE', 10).to_f / 100.0
      (total * fee_percentage).to_i
    end

    def success_url
      Rails.application.routes.url_helpers.success_event_event_purchase_url(event, purchase)
    end

    def cancel_url
      Rails.application.routes.url_helpers.failure_event_event_purchase_url(event, purchase)
    end
  end
end
