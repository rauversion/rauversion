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

      Rails.logger.info("Stripe Checkout Line Items: #{line_items.inspect}")

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

    def stripe_amount(amount, currency)
      exponent = Money::Currency.new(currency).exponent # USD=2, CLP=0, KWD=3, etc.
      (BigDecimal(amount.to_s) * (10 ** exponent)).to_i
    end

    def build_line_items
      purchase.purchased_items.group_by(&:purchased_item_id).map do |ticket_id, items|
        ticket = EventTicket.find(ticket_id)
        # Use the price stored in purchased_items (which respects custom_price for PWYW tickets)
        item_price = items.first.price || ticket.price
        
        {
          "quantity" => items.count,
          "price_data" => {
            "unit_amount" => stripe_amount(item_price, ticket.event.ticket_currency),
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
      Rails.application.routes.url_helpers.success_event_event_purchase_url(event, purchase.signed_id)
    end

    def cancel_url
      Rails.application.routes.url_helpers.failure_event_event_purchase_url(event, purchase)
    end
  end
end
