module ServiceBookings
  class StripeCheckout
    ZERO_DECIMAL_CURRENCIES = %w[bif clp djf gnf jpy kmf krw mga pyg rwf ugx vnd vuv xaf xof xpf].freeze

    attr_reader :booking, :milestone

    def initialize(booking:, milestone:)
      @booking = booking
      @milestone = milestone.to_s
    end

    def create_session
      return { error: "Invalid payment milestone" } unless valid_milestone?
      return { error: "This milestone is already paid" } unless amount.positive?

      session = Stripe::Checkout::Session.create(checkout_params)
      persist_session!(session)

      { checkout_url: session.url, checkout_session_id: session.id }
    rescue Stripe::StripeError => e
      { error: e.message }
    end

    private

    def valid_milestone?
      %w[deposit balance].include?(milestone)
    end

    def amount
      case milestone
      when "deposit" then booking.deposit_amount.to_d
      when "balance" then booking.balance_due_amount.to_d
      else 0.to_d
      end
    end

    def checkout_params
      params = {
        payment_method_types: ["card"],
        line_items: [
          {
            quantity: 1,
            price_data: {
              unit_amount: stripe_amount(amount, booking.currency),
              currency: booking.currency,
              product_data: {
                name: line_item_name,
                description: "#{booking.service_product.title} - #{booking.customer.full_name}"
              }
            }
          }
        ],
        mode: "payment",
        success_url: service_booking_url(stripe_checkout: milestone, payment: "success"),
        cancel_url: service_booking_url(stripe_checkout: milestone, payment: "cancelled"),
        client_reference_id: "service_booking:#{booking.id}:#{milestone}",
        customer_email: booking.customer.email,
        metadata: metadata,
        payment_intent_data: {
          metadata: metadata
        }
      }

      if destination_charge?
        params[:payment_intent_data][:application_fee_amount] = stripe_amount(platform_fee_for_milestone, booking.currency)
        params[:payment_intent_data][:transfer_data] = {
          destination: booking.provider.stripe_account_id
        }
      end

      params
    end

    def destination_charge?
      booking.provider.stripe_account_id.present? &&
        ENV.fetch("SERVICE_BOOKING_STRIPE_TRANSFER_MODE", "platform_hold") == "destination_charge"
    end

    def platform_fee_for_milestone
      total = booking.total_amount.to_d
      return 0.to_d unless total.positive?

      booking.platform_fee_amount.to_d * (amount / total)
    end

    def metadata
      {
        source_type: "service_booking",
        service_booking_id: booking.id,
        milestone: milestone
      }
    end

    def line_item_name
      I18n.t("service_bookings.payment_tracking.stripe_line_item.#{milestone}", title: booking.service_product.title)
    end

    def service_booking_url(params)
      Rails.application.routes.url_helpers.service_booking_url(
        booking,
        params.merge(host: callback_host)
      )
    end

    def callback_host
      host = Rails.application.routes.default_url_options[:host].presence || ENV.fetch("HOST", "localhost:3000")
      host.to_s.sub(%r{\Ahttps?://}, "").sub(%r{/.*\z}, "")
    end

    def stripe_amount(value, currency)
      multiplier = ZERO_DECIMAL_CURRENCIES.include?(currency.to_s.downcase) ? 1 : 100
      (value.to_d * multiplier).to_i
    end

    def persist_session!(session)
      attributes = {
        checkout_provider: "stripe",
        payment_status: :pending
      }

      if milestone == "deposit"
        attributes[:deposit_status] = :checkout_created
        attributes[:deposit_checkout_session_id] = session.id
      else
        attributes[:balance_status] = :checkout_created
        attributes[:balance_checkout_session_id] = session.id
      end

      booking.update!(attributes)
      booking.record_ledger_entry!(
        entry_type: :checkout_created,
        milestone: milestone,
        amount: amount,
        direction: :neutral,
        actor: booking.customer,
        status: "#{milestone}_checkout_created",
        gateway: "stripe",
        gateway_reference: session.id,
        idempotency_key: "stripe:service_booking:#{booking.id}:#{milestone}:checkout_created:#{session.id}",
        metadata: {
          checkout_session_id: session.id,
          checkout_url: session.url,
          transfer_mode: ENV.fetch("SERVICE_BOOKING_STRIPE_TRANSFER_MODE", "platform_hold")
        }
      )
    end
  end
end
