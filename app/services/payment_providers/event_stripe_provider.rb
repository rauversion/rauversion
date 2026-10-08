module PaymentProviders
  class EventStripeProvider < BaseProvider
    class InvalidFeeConfiguration < StandardError; end

    DEFAULT_TICKET_TAX_CODE = "txcd_10000000"

    attr_reader :event, :purchase

    def initialize(event:, user:, purchase:)
      @event = event
      super(user: user, purchase: purchase, cart: nil)
    end

    def create_checkout_session
      return { error: "No tickets selected" } unless validate_purchase!

      connected_account_id = event.user.stripe_account_id
      return { error: "The event organizer must connect a Stripe account" } if connected_account_id.blank?

      begin
        checkout_params = build_checkout_params(connected_account_id)
        client = Stripe::StripeClient.new(api_key: ENV["STRIPE_CLIENT_SECRET"])
        session, = client.request { Stripe::Checkout::Session.create(checkout_params) }
        
        purchase.update!(
          checkout_type: "stripe",
          checkout_id: session.id,
          currency: event.ticket_currency.downcase,
          payment_metadata: checkout_params.fetch(:metadata).stringify_keys.merge(
            "amount_unit" => "minor",
            "connected_account_id" => connected_account_id
          )
        )

        { checkout_url: session.url }
      rescue Stripe::InvalidRequestError, InvalidFeeConfiguration, StripeProcessingFeeEstimate::InvalidConfiguration => e
        { error: e.message }
      end
    end

    private

    def validate_purchase!
      purchase.purchased_items.any?
    end

    def build_checkout_params(connected_account_id)
      ticket_line_items = build_line_items
      ticket_total = calculate_total(ticket_line_items)
      service_fee_amount = calculate_fee(ticket_total)
      line_items = ticket_line_items + build_service_fee_line_items(service_fee_amount)
      processing_fee_base_amount = ticket_total + service_fee_amount
      processing_fee_amount = StripeProcessingFeeEstimate.call(
        total: processing_fee_base_amount, currency: event.ticket_currency, source: "ticket"
      )
      application_fee_amount = [service_fee_amount + processing_fee_amount, processing_fee_base_amount].min
      fee_metadata = {
        source_type: "event",
        event_id: event.id,
        purchase_id: purchase.id,
        processing_fee_payer: "seller",
        processing_fee_model: "estimated",
        currency: event.ticket_currency.downcase,
        ticket_total_amount: ticket_total,
        service_fee_percentage: event.effective_fee,
        service_fee_amount: service_fee_amount,
        estimated_processing_fee_amount: processing_fee_amount,
        application_fee_amount: application_fee_amount,
        processing_fee_base_amount: processing_fee_base_amount,
        ticket_tax_behavior: ticket_tax_behavior,
        ticket_tax_code: ticket_tax_code,
        service_fee_tax_code: service_fee_tax_code,
        automatic_tax_enabled: tax_enabled?.to_s,
        tax_liability_type: tax_enabled? ? "self" : "none",
        processing_fee_base_model: tax_enabled? && ticket_tax_behavior == "exclusive" ? "before_exclusive_tax" : "checkout_total"
      }

      Rails.logger.info("Stripe Checkout Line Items: #{line_items.inspect}")

      {
        line_items: line_items,
        payment_intent_data: {
          application_fee_amount: application_fee_amount,
          transfer_data: {
            destination: connected_account_id
          },
          metadata: fee_metadata
        },
        automatic_tax: automatic_tax_options(connected_account_id),
        customer_email: user.email,
        billing_address_collection: tax_enabled? ? "required" : "auto",
        mode: "payment",
        success_url: success_url,
        cancel_url: cancel_url,
        metadata: fee_metadata
      }
    end

    def tax_enabled?
      !%w[false 0 no off].include?(ENV.fetch("STRIPE_AUTOMATIC_TAX_ENABLED", "true").to_s.downcase)
    end

    def automatic_tax_options(connected_account_id)
      enabled = tax_enabled?
      return { enabled: enabled } unless enabled

      options = { enabled: true }

      if connected_account_id.present?
        options[:liability] = {
          type: "self"
        }
      end

      options
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
            "tax_behavior" => ticket_tax_behavior,
            "product_data" => {
              "name" => ticket.title,
              "description" => "#{ticket.short_description} \r for event: #{ticket.event.title}",
              "tax_code" => ticket_tax_code
            }
          }
        }
      end
    end

    def build_service_fee_line_items(service_fee_amount)
      return [] unless service_fee_amount.positive?

      [
        {
          "quantity" => 1,
          "price_data" => {
            "unit_amount" => service_fee_amount,
            "currency" => event.ticket_currency,
            "tax_behavior" => ticket_tax_behavior,
            "product_data" => {
              "name" => service_fee_name,
              "description" => service_fee_description("event"),
              "tax_code" => service_fee_tax_code
            }
          }
        }
      ]
    end

    def ticket_tax_behavior
      event.effective_ticket_tax_behavior
    end

    def ticket_tax_code
      ENV.fetch("STRIPE_TICKET_TAX_CODE", DEFAULT_TICKET_TAX_CODE)
    end

    def service_fee_tax_code
      ENV.fetch("STRIPE_SERVICE_FEE_TAX_CODE", DEFAULT_TICKET_TAX_CODE)
    end

    def calculate_total(line_items)
      line_items.sum { |item| item["price_data"]["unit_amount"] * item["quantity"].to_i }
    end

    def calculate_fee(total)
      # Use event's custom_fee if set, otherwise fall back to env var
      percentage = event.effective_fee.to_d
      unless percentage.finite? && percentage >= 0 && percentage <= 100
        raise InvalidFeeConfiguration, "Invalid event service fee percentage"
      end

      (total * percentage / 100).to_i
    end

    def success_url
      Rails.application.routes.url_helpers.success_event_event_purchase_url(event, purchase.signed_id)
    end

    def cancel_url
      Rails.application.routes.url_helpers.failure_event_event_purchase_url(event, purchase)
    end
  end
end
