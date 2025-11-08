require "rails_helper"

RSpec.describe "EventPurchases", type: :request do
  let(:user) { FactoryBot.create(:user) }
  let(:event) { FactoryBot.create(:event, user: user, private: false) }

  before do
    sign_in user
  end

  describe "POST /create with free tickets" do
    let!(:free_ticket) { FactoryBot.create(:event_ticket, event: event, qty: 10, price: 0) }

    it "completes the purchase automatically without Stripe" do
      expect {
        post event_event_purchases_path(event), params: {
          tickets: [
            { id: free_ticket.id, quantity: 2 }
          ]
        }
      }.to change(Purchase, :count).by(1)
        .and change(PurchasedItem, :count).by(2)

      purchase = Purchase.last
      expect(purchase.state).to eq('paid')
      expect(purchase.price).to eq(0)
      expect(purchase.purchased_items.count).to eq(2)
      expect(response).to redirect_to(success_event_event_purchase_path(event, purchase))
    end

    it "decrements ticket quantity after free purchase" do
      expect {
        post event_event_purchases_path(event), params: {
          tickets: [
            { id: free_ticket.id, quantity: 2 }
          ]
        }
      }.to change { free_ticket.reload.qty }.from(10).to(8)
    end
  end

  describe "POST /create with paid tickets" do
    let!(:paid_ticket) { FactoryBot.create(:event_ticket, event: event, qty: 10, price: 10) }

    it "creates purchase but does not complete it (waits for Stripe)" do
      allow_any_instance_of(PaymentProviders::EventStripeProvider).to receive(:create_checkout_session).and_return(
        { checkout_url: "https://stripe.com/checkout/session" }
      )

      expect {
        post event_event_purchases_path(event), params: {
          tickets: [
            { id: paid_ticket.id, quantity: 1 }
          ]
        }
      }.to change(Purchase, :count).by(1)
        .and change(PurchasedItem, :count).by(1)

      purchase = Purchase.last
      expect(purchase.state).to eq('pending')
      expect(response.body).to include("stripe.com")
    end
  end

  describe "POST /create with mixed free and paid tickets" do
    let!(:free_ticket) { FactoryBot.create(:event_ticket, event: event, qty: 10, price: 0) }
    let!(:paid_ticket) { FactoryBot.create(:event_ticket, event: event, qty: 10, price: 10) }

    it "goes through Stripe when there are any paid tickets" do
      allow_any_instance_of(PaymentProviders::EventStripeProvider).to receive(:create_checkout_session).and_return(
        { checkout_url: "https://stripe.com/checkout/session" }
      )

      expect {
        post event_event_purchases_path(event), params: {
          tickets: [
            { id: free_ticket.id, quantity: 1 },
            { id: paid_ticket.id, quantity: 1 }
          ]
        }
      }.to change(Purchase, :count).by(1)

      purchase = Purchase.last
      expect(purchase.state).to eq('pending')
    end
  end
end
