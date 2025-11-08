require "rails_helper"

RSpec.describe "EventPurchases", type: :request do
  let(:user) { FactoryBot.create(:user) }
  let(:event) { FactoryBot.create(:event, user: user, state: "published") }

  before do
    user.confirm
    sign_in user
  end

  describe "POST /create with free tickets" do
    let!(:free_ticket) { FactoryBot.create(:event_ticket, event: event, qty: 10, price: 0, selling_start: 1.day.ago) }

    it "completes the purchase automatically without Stripe" do
      perform_enqueued_jobs
      expect {
        post event_event_purchases_path(event), params: {
          format: :json,
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
      expect(response).to have_http_status(:success)
    end

    it "returns JSON without payment_url for frontend to handle" do
      perform_enqueued_jobs
      post event_event_purchases_path(event, format: :json), params: {
        format: :json,
        tickets: [
          { id: free_ticket.id, quantity: 1 }
        ]
      }
      
      json = JSON.parse(response.body)
      expect(json['payment_url']).to be_nil
      expect(json['id']).to be_present
      expect(json['purchased_items']).to be_an(Array)
      expect(json['purchased_items'].length).to eq(1)
    end

    it "decrements ticket quantity after free purchase" do
      
      expect {
        perform_enqueued_jobs do
          post event_event_purchases_path(event), params: {
            format: :json,
            tickets: [
              { id: free_ticket.id, quantity: 2 }
            ]
          }
        end
      }.to change { free_ticket.reload.qty }.from(10).to(8)
    end
  end

  describe "POST /create with paid tickets" do
    let!(:paid_ticket) { FactoryBot.create(
      :event_ticket, 
      event: event, 
      qty: 10, 
      price: 10,
      selling_start: 1.day.ago
      ) 
    }

    it "creates purchase but does not complete it (waits for Stripe)" do
      allow_any_instance_of(PaymentProviders::EventStripeProvider).to receive(:create_checkout_session).and_return(
        { checkout_url: "https://stripe.com/checkout/session" }
      )

      expect {
        perform_enqueued_jobs  do
          post event_event_purchases_path(event), params: {
            format: :json,
            tickets: [
              { id: paid_ticket.id, quantity: 1 }
            ]
          }
        end
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
        perform_enqueued_jobs do
          post event_event_purchases_path(event), params: {
            format: :json,
            tickets: [
              { id: free_ticket.id, quantity: 1 },
            { id: paid_ticket.id, quantity: 1 }
          ]
        }
      end
      }.to change(Purchase, :count).by(1)

      purchase = Purchase.last
      expect(purchase.state).to eq('pending')
    end
  end
end
