require "rails_helper"

RSpec.describe PaymentProviders::EventStripeProvider, type: :service do
  let!(:user) { FactoryBot.create(:user) }
  let!(:event) { FactoryBot.create(:event, user: user) }
  let!(:ticket) { FactoryBot.create(:event_ticket, event: event, qty: 10, price: 100.0) }
  let!(:purchase) { FactoryBot.create(:purchase, user: user, purchasable: event) }

  before do
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

    it "enables Stripe automatic tax for ticket checkout" do
      provider.create_checkout_session

      expect(Stripe::Checkout::Session).to have_received(:create).with(
        hash_including(
          automatic_tax: {
            enabled: true
          }
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
            application_fee_amount: 1_000
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
