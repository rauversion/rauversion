require 'rails_helper'

RSpec.describe "EventAttendees", type: :request do
  let(:user) { create(:user) }
  let(:event) { create(:event, user: user, ticket_currency: "usd") }
  let(:ticket) { create(:event_ticket, event: event) }
  
  before do
    user.confirm
    sign_in user
  end

  describe "GET /events/:event_id/event_attendees" do
    let!(:pending_purchase) do
      purchase = create(:purchase, user: user, purchasable: event, state: 'pending')
      create(:purchased_item, purchase: purchase, purchased_item: ticket, state: 'pending')
    end
    
    let!(:paid_purchase) do
      purchase = create(:purchase, user: user, purchasable: event, state: 'paid')
      create(:purchased_item, purchase: purchase, purchased_item: ticket, state: 'paid')
    end

    it "returns all attendees when no filter is applied" do
      get event_event_attendees_path(event), as: :json
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json['collection'].length).to eq(2)
    end

    it "filters by pending status" do
      get event_event_attendees_path(event), params: { status: 'pending' }, as: :json
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json['collection'].length).to eq(1)
      expect(json['collection'].first['state']).to eq('pending')
    end

    it "filters by paid status" do
      get event_event_attendees_path(event), params: { status: 'paid' }, as: :json
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json['collection'].length).to eq(1)
      expect(json['collection'].first['state']).to eq('paid')
    end
  end

  describe "GET /events/:event_id/event_attendees/export_csv" do
    it "enqueues a CSV export job for event owner" do
      expect {
        get export_csv_event_event_attendees_path(event, format: :json), as: :json
      }.to have_enqueued_job(EventAttendeesCsvExportJob)
      
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json['message']).to include('CSV export')
    end

    it "denies access to non-owner" do
      other_user = create(:user)
      other_user.confirm
      sign_in other_user
      
      get export_csv_event_event_attendees_path(event, format: :json), as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /events/:event_id/event_attendees/tickets" do
    let!(:ticket1) { create(:event_ticket, event: event, title: "VIP") }
    let!(:ticket2) { create(:event_ticket, event: event, title: "General") }

    it "returns all tickets for the event" do
      ticket
      get tickets_event_event_attendees_path(event), as: :json
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json['collection'].length).to eq(3) # including the ticket from let
    end
  end

  describe "POST /events/:event_id/event_attendees/create_invitation" do
    let(:new_email) { 'newuser@example.com' }
    
    it "creates a new user and purchase with pending status" do
      expect {
        perform_enqueued_jobs do
          post create_invitation_event_event_attendees_path(event), 
               params: { email: new_email, ticket_id: ticket.id },
               as: :json
        end
      }.to change(User, :count).by(1)
         .and change(Purchase, :count).by(1)
         .and change(PurchasedItem, :count).by(1)
      
      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['message']).to include('Invitation created')
      
      new_user = User.find_by(email: new_email)
      expect(new_user).to be_present
      
      purchase = Purchase.last
      expect(purchase.state).to eq('paid')
      expect(purchase.purchased_items.first.state).to eq('paid')
    end

    it "uses existing user if email already exists" do
      existing_user = create(:user, email: 'existing@example.com')
      
      expect {
        post create_invitation_event_event_attendees_path(event, format: :json),
             params: { email: existing_user.email, ticket_id: ticket.id },
             as: :json
      }.to change(User, :count).by(0)
         .and change(Purchase, :count).by(1)
      
      expect(response).to have_http_status(:created)
    end

    it "denies access to non-owner" do
      other_user = create(:user)
      other_user.confirm
      sign_in other_user
      
      post create_invitation_event_event_attendees_path(event, format: :json),
           params: { email: 'test@example.com', ticket_id: ticket.id },
           as: :json
           
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns error when email is missing" do
      post create_invitation_event_event_attendees_path(event),
           params: { email: nil, ticket_id: ticket.id },
           as: :json
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json['errors']).to include('Email and ticket are required')
    end

    it "returns error when ticket_id is invalid" do
      post create_invitation_event_event_attendees_path(event, format: :json),
           params: { email: 'test@example.com', ticket_id: 99999 },
           as: :json
      expect(response).to have_http_status(:not_found)
      json = JSON.parse(response.body)
      expect(json['errors']).to include('Ticket not found')
    end
  end

  describe "POST /events/:event_id/event_attendees/:id/refund" do
    let!(:paid_item) do
      purchase = create(:purchase, user: user, purchasable: event, state: 'paid', checkout_type: 'stripe', checkout_id: 'cs_test_123')
      create(:purchased_item, purchase: purchase, purchased_item: ticket, state: 'paid')
    end

    before do
      # Mock Stripe calls
      allow(Stripe::Checkout::Session).to receive(:retrieve).and_return(
        double(payment_intent: 'pi_test_123')
      )
      allow(Stripe::Refund).to receive(:create).and_return(
        double(id: 'ref_test_123')
      )
    end

    it "processes refund for a paid ticket" do
      initial_qty = ticket.qty
      
      post refund_event_event_attendee_path(event, paid_item), as: :json
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['message']).to include('Refund processed')
      
      paid_item.reload
      expect(paid_item.state).to eq('refunded')
      expect(paid_item.refunded_at).to be_present
      expect(paid_item.refund_id).to eq('ref_test_123')
      
      ticket.reload
      expect(ticket.qty).to eq(initial_qty + 1)
    end

    it "denies refund for already refunded ticket" do
      paid_item.refund!
      paid_item.update(refunded_at: Time.current)
      
      post refund_event_event_attendee_path(event, paid_item), as: :json
      
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json['errors']).to include('This ticket has already been refunded')
    end

    it "denies refund for pending ticket" do
      pending_item = create(:purchased_item, 
                           purchase: create(:purchase, user: user, purchasable: event, state: 'pending'),
                           purchased_item: ticket, 
                           state: 'pending')
      
      post refund_event_event_attendee_path(event, pending_item), as: :json
      
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json['errors']).to include('Only paid tickets can be refunded')
    end

    it "denies access to non-owner" do
      other_user = create(:user)
      other_user.confirm
      sign_in other_user
      
      post refund_event_event_attendee_path(event, paid_item), as: :json
      
      expect(response).to have_http_status(:unauthorized)
    end

    it "handles Stripe errors gracefully" do
      allow(Stripe::Refund).to receive(:create).and_raise(
        Stripe::StripeError.new("Test error")
      )
      
      post refund_event_event_attendee_path(event, paid_item), as: :json
      
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json['errors'].first).to include('Refund failed')
    end

    it "processes refund with CLP currency correctly (zero-decimal)" do
      # Create event with CLP currency
      clp_event = create(:event, user: user, ticket_currency: "clp")
      clp_ticket = create(:event_ticket, event: clp_event, price: 50000)
      clp_purchase = create(:purchase, user: user, purchasable: clp_event, state: 'paid', 
                            checkout_type: 'stripe', checkout_id: 'cs_test_clp', currency: 'clp')
      clp_paid_item = create(:purchased_item, purchase: clp_purchase, 
                             purchased_item: clp_ticket, state: 'paid')

      # Mock Stripe calls
      allow(Stripe::Checkout::Session).to receive(:retrieve).and_return(
        double(payment_intent: 'pi_test_clp')
      )
      
      # Verify that Stripe::Refund.create is called with the correct amount (no * 100 for CLP)
      expect(Stripe::Refund).to receive(:create).with(
        hash_including(amount: 50000)  # Should be 50000, not 5000000
      ).and_return(double(id: 'ref_test_clp'))
      
      post refund_event_event_attendee_path(clp_event, clp_paid_item), as: :json
      
      expect(response).to have_http_status(:ok)
    end

    it "processes refund with USD currency correctly (with cents)" do
      # Purchase already has usd currency by default
      usd_ticket_with_price = create(:event_ticket, event: event, price: 50.00)
      usd_purchase = create(:purchase, user: user, purchasable: event, state: 'paid',
                            checkout_type: 'stripe', checkout_id: 'cs_test_usd', currency: 'usd')
      usd_paid_item = create(:purchased_item, purchase: usd_purchase,
                             purchased_item: usd_ticket_with_price, state: 'paid')

      allow(Stripe::Checkout::Session).to receive(:retrieve).and_return(
        double(payment_intent: 'pi_test_usd')
      )
      
      # Verify that Stripe::Refund.create is called with amount in cents for USD
      expect(Stripe::Refund).to receive(:create).with(
        hash_including(amount: 5000)  # Should be 5000 cents = $50.00
      ).and_return(double(id: 'ref_test_usd'))
      
      post refund_event_event_attendee_path(event, usd_paid_item), as: :json
      
      expect(response).to have_http_status(:ok)
    end
  end
end
