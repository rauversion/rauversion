require "rails_helper"

RSpec.describe PaymentProviders::TicketPricingExamples do
  let(:event) { build(:event, custom_fee: 3, ticket_currency: "clp") }

  before do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with("STRIPE_TICKET_PROCESSING_FEE_PERCENTAGE", "2.9").and_return("2.9")
    allow(ENV).to receive(:fetch).with("STRIPE_TICKET_PROCESSING_FIXED_FEE_USD", "0.30").and_return("0.30")
    allow(ENV).to receive(:fetch).with("STRIPE_TICKET_PROCESSING_FIXED_FEE_CLP", "0").and_return("0")
    allow(ENV).to receive(:fetch).with("STRIPE_AUTOMATIC_TAX_ENABLED", "true").and_return("true")
  end

  it "shows a CLP 1,000 example using the event commission and distinguishes tax from seller profit" do
    example = described_class.call(event).fetch("clp")

    expect(example).to include(ticket_amount: 1_000, currency_exponent: 0, service_fee_percentage: 3,
      service_fee_amount: 30, estimated_processing_fee_amount: 30, illustrative_tax_percentage: 19)
    expect(example[:inclusive]).to eq(
      amount_total: 1_030, amount_tax: 164, seller_payment_before_tax: 970, seller_amount_after_tax_reserve: 806
    )
    expect(example[:exclusive]).to eq(
      amount_total: 1_226, amount_tax: 196, seller_payment_before_tax: 1_166, seller_amount_after_tax_reserve: 970
    )
  end

  it "matches the USD 20 pricing example verified with Stripe's test tax calculation" do
    event.custom_fee = 8
    example = described_class.call(event).fetch("usd")

    expect(example).to include(ticket_amount: 2_000, currency_exponent: 2,
      service_fee_amount: 160, estimated_processing_fee_amount: 93)
    expect(example[:inclusive]).to eq(
      amount_total: 2_160, amount_tax: 345, seller_payment_before_tax: 1_907, seller_amount_after_tax_reserve: 1_562
    )
    expect(example[:exclusive]).to eq(
      amount_total: 2_570, amount_tax: 410, seller_payment_before_tax: 2_317, seller_amount_after_tax_reserve: 1_907
    )
  end

  it "uses processing fee settings in the example's currency" do
    allow(ENV).to receive(:fetch).with("STRIPE_TICKET_PROCESSING_FIXED_FEE_CLP", "0").and_return("300")
    example = described_class.call(event).fetch("clp")

    expect(example[:estimated_processing_fee_amount]).to eq(330)
    expect(example[:inclusive][:seller_payment_before_tax]).to eq(670)
  end

  it "shows no tax when automatic tax is disabled" do
    allow(ENV).to receive(:fetch).with("STRIPE_AUTOMATIC_TAX_ENABLED", "true").and_return("false")
    example = described_class.call(event).fetch("clp")

    expect(example).to include(tax_enabled: false, illustrative_tax_percentage: 0)
    expect(example[:inclusive]).to eq(example[:exclusive])
    expect(example[:inclusive]).to include(amount_tax: 0, amount_total: 1_030, seller_amount_after_tax_reserve: 970)
  end

  it "omits misleading examples when processing fees are invalid" do
    allow(ENV).to receive(:fetch).with("STRIPE_TICKET_PROCESSING_FEE_PERCENTAGE", "2.9").and_return("invalid")

    expect(described_class.call(event)).to be_empty
  end

  it "skips unknown or unset event currencies without breaking the editor" do
    event.ticket_currency = nil
    expect(described_class.call(event)).to have_key("clp")

    event.ticket_currency = "invalid"
    expect(described_class.call(event)).not_to have_key("invalid")
  end

  it "omits examples when the service commission would be invalid at checkout" do
    event.custom_fee = -5

    expect(described_class.call(event)).to be_empty
  end
end
