module PaymentProviders
  class TicketPricingExamples
    CURRENCIES = %w[clp usd eur gbp cad aud mxn brl jpy nzd].freeze
    ILLUSTRATIVE_TAX_PERCENTAGE = 19

    def self.call(event)
      service_percentage = event.effective_fee.to_d
      return {} unless service_percentage.finite? && service_percentage.between?(0, 100)

      currencies = (CURRENCIES + [event.ticket_currency.to_s.downcase]).uniq
      currencies.each_with_object({}) do |currency_code, examples|
        currency = Money::Currency.find(currency_code)
        next unless currency

        multiplier = 10 ** currency.exponent
        ticket_amount = (currency.exponent.zero? ? 1_000 : 20) * multiplier
        service_fee = (ticket_amount * service_percentage / 100).to_i
        processing_base = ticket_amount + service_fee
        processing_fee = StripeProcessingFeeEstimate.call(total: processing_base, currency: currency_code, source: "ticket")
        application_fee = [service_fee + processing_fee, processing_base].min
        tax_enabled = !%w[false 0 no off].include?(ENV.fetch("STRIPE_AUTOMATIC_TAX_ENABLED", "true").to_s.downcase)
        tax_percentage = tax_enabled ? ILLUSTRATIVE_TAX_PERCENTAGE : 0

        examples[currency_code] = {
          currency: currency_code,
          currency_exponent: currency.exponent,
          ticket_amount: ticket_amount,
          service_fee_percentage: service_percentage.to_f,
          service_fee_amount: service_fee,
          estimated_processing_fee_amount: processing_fee,
          processing_fee_base_amount: processing_base,
          tax_enabled: tax_enabled,
          illustrative_tax_percentage: tax_percentage,
          inclusive: breakdown(processing_base, application_fee, tax_percentage, inclusive: true),
          exclusive: breakdown(processing_base, application_fee, tax_percentage, inclusive: false)
        }
      rescue StripeProcessingFeeEstimate::InvalidConfiguration
        # An invalid fee setting must not prevent opening the event editor.
        next
      end
    end

    def self.breakdown(base, application_fee, tax_percentage, inclusive:)
      tax_amount = if inclusive
        (base.to_d * tax_percentage / (100 + tax_percentage)).round.to_i
      else
        (base.to_d * tax_percentage / 100).round.to_i
      end
      total = inclusive ? base : base + tax_amount
      seller_payment = total - application_fee

      {
        amount_total: total,
        amount_tax: tax_amount,
        seller_payment_before_tax: seller_payment,
        seller_amount_after_tax_reserve: seller_payment - tax_amount
      }
    end
    private_class_method :breakdown
  end
end
