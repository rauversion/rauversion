module PaymentProviders
  class StripeProcessingFeeEstimate
    class InvalidConfiguration < StandardError; end

    def self.call(total:, currency:, source:)
      return 0 unless total.positive?

      currency = currency.to_s.downcase
      prefix = "STRIPE_#{source.upcase}_PROCESSING"
      percentage = BigDecimal(ENV.fetch("#{prefix}_FEE_PERCENTAGE", "2.9").to_s)
      fixed_default = currency == "usd" ? "0.30" : "0"
      fixed = BigDecimal(ENV.fetch("#{prefix}_FIXED_FEE_#{currency.upcase}", fixed_default).to_s)
      unless percentage.finite? && fixed.finite? && percentage >= 0 && percentage < 100 && fixed >= 0
        raise ArgumentError
      end

      multiplier = 10 ** Money::Currency.new(currency).exponent
      (total * percentage / 100).round.to_i + (fixed * multiplier).to_i
    rescue ArgumentError
      raise InvalidConfiguration, "Invalid Stripe #{source} processing fee estimate"
    end
  end
end
