module EventPurchasesHelper
  ZERO_DECIMAL_CURRENCIES = %w[CLP JPY].freeze

  def formatted_event_ticket_price(amount, currency)
    return nil if amount.nil?

    currency_code = currency.to_s.upcase.presence || "USD"
    numeric_amount = BigDecimal(amount.to_s)
    precision = ZERO_DECIMAL_CURRENCIES.include?(currency_code) ? 0 : (numeric_amount.frac.zero? ? 0 : 2)

    number_to_currency(
      numeric_amount,
      unit: "#{currency_code} ",
      format: "%u%n",
      precision: precision
    )
  end
end
