require "rails_helper"

RSpec.describe PaymentProviders::EventStripeProvider, type: :service do
  let!(:user) { FactoryBot.create(:user, stripe_account_id: "acct_event_seller") }
  let!(:event) { FactoryBot.create(:event, user: user) }
  let!(:ticket) { FactoryBot.create(:event_ticket, event: event, qty: 10, price: 100.0) }
  let!(:purchase) { FactoryBot.create(:purchase, user: user, purchasable: event) }

  before do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with("STRIPE_TICKET_PROCESSING_FEE_PERCENTAGE", "2.9").and_return("2.9")
    allow(ENV).to receive(:fetch).with("STRIPE_TICKET_PROCESSING_FIXED_FEE_USD", "0.30").and_return("0.30")
    allow(ENV).to receive(:fetch).with("STRIPE_TICKET_PROCESSING_FIXED_FEE_CLP", "0").and_return("0")
    allow(ENV).to receive(:fetch).with("STRIPE_AUTOMATIC_TAX_ENABLED", "true").and_return("true")
    allow(ENV).to receive(:fetch).with("STRIPE_TICKET_TAX_BEHAVIOR", "exclusive").and_return("exclusive")
    event.ticket_currency = "usd"
    event.save!
    purchase.purchased_items.create!(
      purchased_item: ticket,
      price: ticket.price,
      currency: event.ticket_currency
    )
  end

  describe "#create_checkout_session" do
    subject(:provider) { described_class.new(event: event, user: user, purchase: purchase) }

    let(:stripe_session) do
      double(id: "cs_test_123", url: "https://checkout.stripe.com/c/pay/cs_test_123")
    end

    before do
      allow(Stripe::Checkout::Session).to receive(:create).and_return(stripe_session)
    end

    it "deducts estimated processing costs on tickets plus the service fee from the organizer" do
      event.update!(custom_fee: 8)
      ticket.update!(price: 20)
      purchase.purchased_items.update_all(price: 20)

      provider.create_checkout_session

      expect(Stripe::Checkout::Session).to have_received(:create).with(hash_including(
        payment_intent_data: hash_including(
          application_fee_amount: 253,
          transfer_data: { destination: "acct_event_seller" },
          metadata: hash_including(source_type: "event", purchase_id: purchase.id, processing_fee_payer: "seller",
            service_fee_amount: 160, estimated_processing_fee_amount: 93, processing_fee_base_amount: 2_160)
        ),
        metadata: hash_including(processing_fee_model: "estimated", processing_fee_base_model: "before_exclusive_tax")
      ))
      expect(purchase.reload).to have_attributes(checkout_type: "stripe", checkout_id: "cs_test_123")
      expect(purchase.payment_metadata).to include(
        "source_type" => "event", "event_id" => event.id, "purchase_id" => purchase.id,
        "currency" => "usd", "amount_unit" => "minor", "connected_account_id" => "acct_event_seller",
        "processing_fee_payer" => "seller", "processing_fee_model" => "estimated",
        "ticket_total_amount" => 2_000, "service_fee_percentage" => 8,
        "service_fee_amount" => 160, "estimated_processing_fee_amount" => 93,
        "application_fee_amount" => 253, "processing_fee_base_amount" => 2_160,
        "processing_fee_base_model" => "before_exclusive_tax"
      )
    end

    it "does not add a buyer processing fee line item or hardcode payment methods" do
      event.update!(custom_fee: 8)

      provider.create_checkout_session

      expect(Stripe::Checkout::Session).to have_received(:create) do |params|
        expect(params[:line_items].size).to eq(2)
        expect(params[:line_items].sum { |item| item["price_data"]["unit_amount"] * item["quantity"] }).to eq(10_800)
        expect(params).not_to have_key(:payment_method_types)
        expect(params[:payment_intent_data]).not_to have_key(:transfer_group)
        expect(params.dig(:payment_intent_data, :application_fee_amount)).to eq(1_143)
      end
    end

    it "includes applicable taxes in ticket and service prices when the organizer selects inclusive pricing" do
      event.update!(custom_fee: 8, ticket_tax_behavior: "inclusive")
      purchase.purchased_items.update_all(price: 20)

      provider.create_checkout_session

      expect(Stripe::Checkout::Session).to have_received(:create) do |params|
        expect(params[:line_items].map { |item| item["price_data"]["tax_behavior"] }).to eq(%w[inclusive inclusive])
        expect(params[:line_items].sum { |item| item["price_data"]["unit_amount"] * item["quantity"] }).to eq(2_160)
        expect(params[:automatic_tax]).to eq(enabled: true, liability: { type: "self" })
        expect(params[:payment_intent_data]).to include(application_fee_amount: 253)
        expect(params[:payment_intent_data][:metadata]).to eq(params[:metadata])
        expect(params[:metadata]).to include(ticket_tax_behavior: "inclusive", processing_fee_base_model: "checkout_total")
      end
      expect(purchase.reload.payment_metadata).to include(
        "ticket_tax_behavior" => "inclusive", "processing_fee_base_model" => "checkout_total",
        "service_fee_amount" => 160, "estimated_processing_fee_amount" => 93,
        "ticket_tax_code" => "txcd_10000000", "service_fee_tax_code" => "txcd_10000000",
        "automatic_tax_enabled" => "true", "tax_liability_type" => "self"
      )
    end

    it "lets an event add taxes independently of an inclusive platform default" do
      event.update!(ticket_tax_behavior: "exclusive")
      allow(ENV).to receive(:fetch).with("STRIPE_TICKET_TAX_BEHAVIOR", "exclusive").and_return("inclusive")

      provider.create_checkout_session

      expect(Stripe::Checkout::Session).to have_received(:create) do |params|
        expect(params[:line_items].map { |item| item["price_data"]["tax_behavior"] }).to eq(%w[exclusive exclusive])
        expect(params[:metadata]).to include(ticket_tax_behavior: "exclusive", processing_fee_base_model: "before_exclusive_tax")
      end
    end

    it "charges the fixed processing estimate once for multiple tickets" do
      event.update!(custom_fee: 8)
      purchase.purchased_items.create!(purchased_item: ticket, price: ticket.price, currency: "usd")

      provider.create_checkout_session

      expect(Stripe::Checkout::Session).to have_received(:create).with(hash_including(
        payment_intent_data: hash_including(application_fee_amount: 2_256),
        metadata: hash_including(processing_fee_base_amount: 21_600, estimated_processing_fee_amount: 656)
      ))
    end

    it "estimates processing costs on the stored pay-what-you-want price" do
      event.update!(custom_fee: 8)
      purchase.purchased_items.update_all(price: 50)

      provider.create_checkout_session

      expect(Stripe::Checkout::Session).to have_received(:create).with(hash_including(
        payment_intent_data: hash_including(application_fee_amount: 587),
        metadata: hash_including(service_fee_amount: 400, processing_fee_base_amount: 5_400, estimated_processing_fee_amount: 187)
      ))
    end

    it "deducts processing costs when the event service fee is zero" do
      event.update!(custom_fee: 0)

      provider.create_checkout_session

      expect(Stripe::Checkout::Session).to have_received(:create) do |params|
        expect(params[:line_items].size).to eq(1)
        expect(params.dig(:payment_intent_data, :application_fee_amount)).to eq(320)
        expect(params[:metadata]).to include(service_fee_amount: 0, estimated_processing_fee_amount: 320)
      end
    end

    it "uses a separately configurable ticket processing estimate" do
      event.update!(custom_fee: 8)
      allow(ENV).to receive(:fetch).with("STRIPE_TICKET_PROCESSING_FEE_PERCENTAGE", "2.9").and_return("5.4")
      allow(ENV).to receive(:fetch).with("STRIPE_TICKET_PROCESSING_FIXED_FEE_USD", "0.30").and_return("0.60")

      provider.create_checkout_session

      expect(Stripe::Checkout::Session).to have_received(:create).with(hash_including(
        payment_intent_data: hash_including(application_fee_amount: 1_443),
        metadata: hash_including(service_fee_amount: 800, estimated_processing_fee_amount: 643)
      ))
    end

    it "keeps CLP amounts in pesos without applying the USD fixed fee" do
      event.update!(custom_fee: 8, ticket_currency: "clp")
      purchase.purchased_items.update_all(price: 10_000, currency: "clp")

      provider.create_checkout_session

      expect(Stripe::Checkout::Session).to have_received(:create).with(hash_including(
        payment_intent_data: hash_including(application_fee_amount: 1_113),
        metadata: hash_including(service_fee_amount: 800, processing_fee_base_amount: 10_800, estimated_processing_fee_amount: 313)
      ))
    end

    it "supports a fixed processing estimate configured in pesos" do
      event.update!(custom_fee: 8, ticket_currency: "clp")
      purchase.purchased_items.update_all(price: 10_000, currency: "clp")
      allow(ENV).to receive(:fetch).with("STRIPE_TICKET_PROCESSING_FIXED_FEE_CLP", "0").and_return("300")

      provider.create_checkout_session

      expect(Stripe::Checkout::Session).to have_received(:create).with(hash_including(
        payment_intent_data: hash_including(application_fee_amount: 1_413)
      ))
    end

    it "fails before contacting Stripe when the processing estimate is invalid" do
      allow(ENV).to receive(:fetch).with("STRIPE_TICKET_PROCESSING_FEE_PERCENTAGE", "2.9").and_return("oops")

      expect(provider.create_checkout_session).to eq(error: "Invalid Stripe ticket processing fee estimate")
      expect(Stripe::Checkout::Session).not_to have_received(:create)
      expect(purchase.reload.checkout_id).to be_blank
      expect(purchase.payment_metadata).to be_empty
    end

    it "rejects a negative fixed processing estimate" do
      allow(ENV).to receive(:fetch).with("STRIPE_TICKET_PROCESSING_FIXED_FEE_USD", "0.30").and_return("-0.30")

      expect(provider.create_checkout_session[:error]).to be_present
      expect(Stripe::Checkout::Session).not_to have_received(:create)
    end

    it "caps the retained fee so the organizer proceeds cannot be negative" do
      event.update!(custom_fee: 0)
      allow(ENV).to receive(:fetch).with("STRIPE_TICKET_PROCESSING_FIXED_FEE_USD", "0.30").and_return("200")

      provider.create_checkout_session

      expect(Stripe::Checkout::Session).to have_received(:create).with(hash_including(
        payment_intent_data: hash_including(application_fee_amount: 10_000)
      ))
      expect(purchase.reload.payment_metadata).to include(
        "application_fee_amount" => 10_000, "estimated_processing_fee_amount" => 20_290
      )
    end

    it "requires a connected organizer instead of silently retaining the ticket payment" do
      user.update!(stripe_account_id: nil)

      expect(provider.create_checkout_session).to eq(error: "The event organizer must connect a Stripe account")
      expect(Stripe::Checkout::Session).not_to have_received(:create)
    end

    it "enables Stripe automatic tax for ticket checkout" do
      provider.create_checkout_session

      expect(Stripe::Checkout::Session).to have_received(:create).with(
        hash_including(
          automatic_tax: hash_including(enabled: true)
        )
      )
    end

    it "sets a tax behavior on inline ticket prices" do
      provider.create_checkout_session

      expect(Stripe::Checkout::Session).to have_received(:create).with(
        hash_including(
          line_items: array_including(
            hash_including(
              "price_data" => hash_including(
                "tax_behavior" => "exclusive"
              )
            )
          )
        )
      )
    end

    it "requires billing address collection for tax calculation" do
      provider.create_checkout_session

      expect(Stripe::Checkout::Session).to have_received(:create).with(
        hash_including(
          billing_address_collection: "required"
        )
      )
    end

    it "sets a tax code on inline ticket products" do
      provider.create_checkout_session

      expect(Stripe::Checkout::Session).to have_received(:create).with(
        hash_including(
          line_items: array_including(
            hash_including(
              "price_data" => hash_including(
                "product_data" => hash_including(
                  "tax_code" => "txcd_10000000"
                )
              )
            )
          )
        )
      )
    end

    it "adds the service fee as a visible checkout line item" do
      event.update!(custom_fee: 10)

      provider.create_checkout_session

      expect(Stripe::Checkout::Session).to have_received(:create).with(
        hash_including(
          line_items: array_including(
            hash_including(
              "quantity" => 1,
              "price_data" => hash_including(
                "unit_amount" => 1_000,
                "currency" => "usd",
                "tax_behavior" => "exclusive",
                "product_data" => hash_including(
                  "name" => "Cargo por servicio",
                  "tax_code" => "txcd_10000000"
                )
              )
            )
          ),
          payment_intent_data: hash_including(
            application_fee_amount: 1_349
          )
        )
      )
    end

    context "when STRIPE_TICKET_TAX_BEHAVIOR is configured" do
      before do
        allow(ENV).to receive(:fetch).and_call_original
        allow(ENV).to receive(:fetch).with("STRIPE_TICKET_TAX_BEHAVIOR", "exclusive").and_return("inclusive")
      end

      it "uses the configured ticket tax behavior" do
        provider.create_checkout_session

        expect(Stripe::Checkout::Session).to have_received(:create).with(
          hash_including(
            metadata: hash_including(processing_fee_base_model: "checkout_total"),
            line_items: array_including(
              hash_including(
                "price_data" => hash_including(
                  "tax_behavior" => "inclusive"
                )
              )
            )
          )
        )
      end
    end

    context "when automatic tax is disabled" do
      before do
        allow(ENV).to receive(:fetch).with("STRIPE_AUTOMATIC_TAX_ENABLED", "true").and_return("false")
      end

      it "marks the processing estimate as based on the complete checkout total" do
        provider.create_checkout_session

        expect(Stripe::Checkout::Session).to have_received(:create).with(hash_including(
          automatic_tax: { enabled: false }, billing_address_collection: "auto",
          metadata: hash_including(processing_fee_base_model: "checkout_total")
        ))
      end
    end

    context "when STRIPE_TICKET_TAX_CODE is configured" do
      before do
        allow(ENV).to receive(:fetch).and_call_original
        allow(ENV).to receive(:fetch).with("STRIPE_TICKET_TAX_CODE", "txcd_10000000").and_return("txcd_20030000")
      end

      it "uses the configured ticket tax code" do
        provider.create_checkout_session

        expect(Stripe::Checkout::Session).to have_received(:create).with(
          hash_including(
            line_items: array_including(
              hash_including(
                "price_data" => hash_including(
                  "product_data" => hash_including(
                    "tax_code" => "txcd_20030000"
                  )
                )
              )
            )
          )
        )
      end
    end

    context "when the event seller has a connected Stripe account" do
      before do
        user.update!(stripe_account_id: "acct_connected123")
      end

      it "sets the platform as the automatic tax liability" do
        provider.create_checkout_session

        expect(Stripe::Checkout::Session).to have_received(:create).with(
          hash_including(
            automatic_tax: {
              enabled: true,
              liability: {
                type: "self"
              }
            }
          )
        )
      end
    end
  end

  describe "#calculate_fee" do
    subject(:provider) { described_class.new(event: event, user: user, purchase: purchase) }

    context "when event has a custom_fee set" do
      before do
        event.custom_fee = 5
        event.save!
      end

      it "uses the event's custom_fee for fee calculation" do
        # Total = 10000 cents (100.0 USD), fee = 5% => 500 cents
        total = 10000
        fee = provider.send(:calculate_fee, total)
        expect(fee).to eq(500)
      end
    end

    context "when event does not have a custom_fee" do
      before do
        event.custom_fee = nil
        event.save!
      end

      it "falls back to the PLATFORM_EVENTS_FEE env var" do
        allow(ENV).to receive(:fetch).with('PLATFORM_EVENTS_FEE', 10).and_return(8)
        total = 10000
        fee = provider.send(:calculate_fee, total)
        expect(fee).to eq(800)
      end

      it "uses default of 10% if env var is not set" do
        allow(ENV).to receive(:fetch).with('PLATFORM_EVENTS_FEE', 10).and_return(10)
        total = 10000
        fee = provider.send(:calculate_fee, total)
        expect(fee).to eq(1000)
      end
    end
  end

  describe "#calculate_total" do
    subject(:provider) { described_class.new(event: event, user: user, purchase: purchase) }

    it "multiplies each line item amount by its quantity" do
      line_items = [
        {
          "quantity" => 3,
          "price_data" => {
            "unit_amount" => 10_000
          }
        }
      ]

      expect(provider.send(:calculate_total, line_items)).to eq(30_000)
    end
  end
end
