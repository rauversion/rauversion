require "rails_helper"

RSpec.describe "EventPurchases", type: :request do
  let(:user) { FactoryBot.create(:user) }
  let(:event) { FactoryBot.create(:event, user: user, state: "published", ticket_currency: "USD") }

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
    let!(:free_ticket) { FactoryBot.create(:event_ticket, event: event, qty: 10, price: 0, selling_start: 1.day.ago) }
    let!(:paid_ticket) { FactoryBot.create(:event_ticket, event: event, qty: 10, price: 10, selling_start: 1.day.ago) }

    it "returns an error when mixing free and paid tickets" do
      expect {
        post event_event_purchases_path(event), params: {
          format: :json,
          tickets: [
            { id: free_ticket.id, quantity: 1 },
            { id: paid_ticket.id, quantity: 1 }
          ]
        }
      }.not_to change(Purchase, :count)

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json['errors']).to include(match(/No se pueden comprar tickets gratuitos junto con tickets de pago/))
    end
  end

  describe "POST /create with pay_what_you_want tickets" do
    let!(:pwyw_ticket) do 
      ticket = FactoryBot.create(
        :event_ticket, 
        event: event, 
        qty: 10, 
        price: 5,
        selling_start: 1.day.ago
      )
      ticket.settings = { pay_what_you_want: true, minimum_price: 5.0 }
      ticket.save
      ticket
    end

    it "stores custom_price in purchased_items when provided" do
      allow_any_instance_of(PaymentProviders::EventStripeProvider).to receive(:create_checkout_session).and_return(
        { checkout_url: "https://stripe.com/checkout/session" }
      )

      expect {
        perform_enqueued_jobs do
          post event_event_purchases_path(event), params: {
            format: :json,
            tickets: [
              { id: pwyw_ticket.id, quantity: 2, custom_price: 15.0 }
            ]
          }
        end 
      }.to change(Purchase, :count).by(1)
        .and change(PurchasedItem, :count).by(2)

      purchase = Purchase.last
      purchased_items = purchase.purchased_items
      
      # Each purchased item should have the custom price
      expect(purchased_items.all? { |item| item.price == 15.0 }).to be true
      expect(purchased_items.all? { |item| item.currency == event.ticket_currency }).to be true
    end

    it "enforces minimum_price when custom_price is below minimum" do
      allow_any_instance_of(PaymentProviders::EventStripeProvider).to receive(:create_checkout_session).and_return(
        { checkout_url: "https://stripe.com/checkout/session" }
      )

      expect {
        post event_event_purchases_path(event), params: {
          format: :json,
          tickets: [
            { id: pwyw_ticket.id, quantity: 1, custom_price: 2.0 }
          ]
        }
      }.to change(Purchase, :count).by(1)
        .and change(PurchasedItem, :count).by(1)

      purchase = Purchase.last
      purchased_item = purchase.purchased_items.first
      
      # Price should be enforced to minimum_price
      expect(purchased_item.price).to eq(5.0)
    end

    it "passes custom price to Stripe checkout session" do
      mock_provider = instance_double(PaymentProviders::EventStripeProvider)
      allow(PaymentProviders::EventStripeProvider).to receive(:new).and_return(mock_provider)
      allow(mock_provider).to receive(:create_checkout_session) do
        # Get the purchase instance to verify the line items
        purchase = Purchase.last
        line_items = purchase.purchased_items.group_by(&:purchased_item_id).map do |ticket_id, items|
          ticket = EventTicket.find(ticket_id)
          item_price = items.first.price || ticket.price
          
          {
            "quantity" => items.count,
            "price_data" => {
              "unit_amount" => (BigDecimal(item_price.to_s) * 100).to_i,
              "currency" => ticket.event.ticket_currency,
              "product_data" => {
                "name" => ticket.title,
                "description" => "#{ticket.short_description} \r for event: #{ticket.event.title}"
              }
            }
          }
        end
        
        # Verify that the custom price is used in line items
        expect(line_items.first["price_data"]["unit_amount"]).to eq(2000) # 20.0 * 100
        
        { checkout_url: "https://stripe.com/checkout/session" }
      end

      post event_event_purchases_path(event), params: {
        format: :json,
        tickets: [
          { id: pwyw_ticket.id, quantity: 1, custom_price: 20.0 }
        ]
      }

      expect(response).to have_http_status(:success)
    end
  end

  describe "POST /create with requires_login ticket" do
    let!(:login_required_ticket) do
      ticket = FactoryBot.create(:event_ticket, event: event, qty: 10, price: 10.0, selling_start: 1.day.ago)
      ticket.requires_login = true
      ticket.save
      ticket
    end

    context "when user is not logged in" do
      before { sign_out user }

      it "rejects the purchase and returns an error" do
        post event_event_purchases_path(event), params: {
          format: :json,
          guest_email: "guest@example.com",
          tickets: [
            { id: login_required_ticket.id, quantity: 1 }
          ]
        }

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json['errors']).to be_present
        expect(json['errors']['base']).to include(/requiere inicio de sesión|requires you to be logged in/i)
      end
    end

    context "when user is logged in" do
      it "allows the purchase" do
        allow_any_instance_of(PaymentProviders::EventStripeProvider).to receive(:create_checkout_session).and_return({
          checkout_url: "https://stripe.com/checkout/session"
        })

        expect {
          post event_event_purchases_path(event), params: {
            format: :json,
            tickets: [
              { id: login_required_ticket.id, quantity: 1 }
            ]
          }
        }.to change(Purchase, :count).by(1)

        expect(response).to have_http_status(:success)
      end
    end
  end
end
