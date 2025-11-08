require 'rails_helper'

RSpec.describe "EventAttendees", type: :request do
  let(:user) { create(:user) }
  let(:event) { create(:event, user: user) }
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
      expect(purchase.state).to eq('pending')
      expect(purchase.purchased_items.first.state).to eq('pending')
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
      sign_in other_user
      
      post create_invitation_event_event_attendees_path(event, format: :json),
           params: { email: 'test@example.com', ticket_id: ticket.id },
           as: :json
           
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns error when email is missing" do
      post create_invitation_event_event_attendees_path(event, format: :json),
           params: { email: 'test@example.com', ticket_id: ticket.id },
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
end
