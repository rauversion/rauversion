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
end
