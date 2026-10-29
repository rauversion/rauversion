require 'rails_helper'

RSpec.describe "EventAttendees", type: :request do
  let(:user) { create(:user) }
  let(:admin_staff) { create(:user) }
  let(:admission_staff) { create(:user) }
  let(:grant_admission_staff) { create(:user) }
  let(:event) { create(:event, user: user, ticket_currency: "usd") }
  let(:ticket) { create(:event_ticket, event: event) }
  
  before do
    user.confirm
    admin_staff.confirm
    admission_staff.confirm
    grant_admission_staff.confirm
    create(:event_host, event: event, user: admin_staff, access_role: "admin")
    create(:event_host, event: event, user: admission_staff, access_role: "admission")
    create(:event_host, event: event, user: grant_admission_staff, access_role: "grant_admission")
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
      expect(json['collection'].first.fetch('event_ticket')).to include('id' => ticket.id, 'title' => ticket.title)
      expect(json['collection'].first.fetch('user')).to include('id' => user.id, 'email' => user.email, 'name' => user.display_name)
    end

    it "returns attendees with soft-deleted tickets when searching by email" do
      pending_purchase.update!(price: nil)
      ticket.destroy!
      expect(paid_purchase.reload.purchased_item).to eq(ticket)
      expect(EventTicket.find_by(id: ticket.id)).to be_nil

      get event_event_attendees_path(event), params: { query: user.email, page: 1 }, as: :json

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json.fetch('collection').pluck('id')).to contain_exactly(pending_purchase.id, paid_purchase.id)
      expect(json.fetch('collection').map { |item| item.fetch('event_ticket') }).to all(
        include('id' => ticket.id, 'title' => ticket.title)
      )
      expect(json.fetch('collection').find { |item| item['id'] == pending_purchase.id }.dig('event_ticket', 'price')).to eq(ticket.price.to_s)
      expect(json.dig('metadata', 'total_count')).to eq(2)
    end

    it "keeps attendees with missing tickets and their stored purchase data" do
      paid_purchase.update!(price: 35)
      pending_purchase.update!(price: nil)
      ticket.really_destroy!
      other_ticket = create(:event_ticket, event: event, title: 'VIP')
      other_item = create(:purchased_item, purchase: paid_purchase.purchase, purchased_item: other_ticket, state: 'paid')

      get event_event_attendees_path(event), params: { query: user.email }, as: :json

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json.fetch('collection').pluck('id')).to contain_exactly(pending_purchase.id, paid_purchase.id, other_item.id)
      attendee = json.fetch('collection').find { |item| item['id'] == paid_purchase.id }
      expect(attendee).to include('state' => 'paid', 'price' => '35.0', 'currency' => paid_purchase.currency)
      expect(attendee.fetch('event_ticket')).to include('id' => ticket.id, 'title' => nil, 'price' => '35.0')
      pending_attendee = json.fetch('collection').find { |item| item['id'] == pending_purchase.id }
      expect(pending_attendee.fetch('event_ticket')).to include('id' => ticket.id, 'title' => nil, 'price' => nil)
      expect(json.fetch('collection').find { |item| item['id'] == other_item.id }.dig('event_ticket', 'title')).to eq('VIP')
      expect(json.dig('metadata', 'total_count')).to eq(3)
    end

    it "returns guest purchases when searching by guest email after ticket deletion" do
      guest = create(:user, email: 'guest@example.com')
      purchase = create(:purchase, user: guest, guest_email: guest.email, purchasable: event, state: 'paid')
      item = create(:purchased_item, purchase: purchase, purchased_item: ticket, state: 'paid')
      ticket.destroy!

      get event_event_attendees_path(event), params: { query: 'GUEST@EXAMPLE.COM' }, as: :json

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json.fetch('collection').pluck('id')).to eq([item.id])
      expect(json.fetch('collection').first).to include('guest_email' => purchase.guest_email)
      expect(json.fetch('collection').first.fetch('user')).to include('email' => purchase.guest_email)
      expect(json.dig('metadata', 'total_count')).to eq(1)
    end

    it "includes the RUT in attendee data" do
      paid_purchase.purchase.update!(identifier_type: "rut", identifier_value: "12.345.678-5")
      get event_event_attendees_path(event), as: :json

      attendee = JSON.parse(response.body).fetch("collection").find { |item| item["id"] == paid_purchase.id }
      expect(attendee).to include("identifier_type" => "rut", "identifier_value" => "12345678-5")
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

    it "allows admission staff to view attendees in read-only mode" do
      sign_in admission_staff

      get event_event_attendees_path(event), as: :json

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json.dig('permissions', 'can_create_invitations')).to eq(false)
      expect(json.dig('permissions', 'can_refund_attendees')).to eq(false)
    end

    describe "filtering by QR admission" do
      let!(:unchecked_item) do
        create(:purchased_item, purchase: paid_purchase.purchase, purchased_item: ticket,
          state: "paid", checked_in: false)
      end

      before do
        paid_purchase.set_checked_in!(true)
      end

      it "returns only attendees with a registered admission" do
        sign_in admission_staff

        get event_event_attendees_path(event), params: { checked_in: "true" }, as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json.fetch("collection").pluck("id")).to eq([paid_purchase.id])
        expect(json.fetch("collection").first.fetch("checked_in_at")).to be_present
        expect(json.dig("metadata", "total_count")).to eq(1)
      end

      it "includes false and legacy null admission values when filtering unvalidated attendees" do
        get event_event_attendees_path(event), params: { checked_in: "false" }, as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json.fetch("collection").pluck("id")).to contain_exactly(pending_purchase.id, unchecked_item.id)
        expect(json.dig("metadata", "total_count")).to eq(2)
      end

      it "restores all attendees when the admission filter is cleared" do
        ["true", "all", nil].each do |checked_in|
          get event_event_attendees_path(event), params: { checked_in: checked_in }, as: :json

          expected_ids = checked_in == "true" ? [paid_purchase.id] : [pending_purchase.id, paid_purchase.id, unchecked_item.id]
          expect(JSON.parse(response.body).fetch("collection").pluck("id")).to match_array(expected_ids)
        end
      end

      it "combines admission with the attendee search and payment status" do
        other_attendee = create(:user, email: "other.attendee@example.com")
        other_purchase = create(:purchase, user: other_attendee, purchasable: event, state: "paid")
        create(:purchased_item, purchase: other_purchase, purchased_item: ticket, state: "paid", checked_in: true)
        create(:purchased_item, purchase: paid_purchase.purchase, purchased_item: ticket, state: "refunded", checked_in: true)

        get event_event_attendees_path(event), params: { checked_in: "true", query: user.email, status: "paid" }, as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json.fetch("collection").pluck("id")).to eq([paid_purchase.id])
        expect(json.dig("metadata", "total_count")).to eq(1)
      end

      it "filters admission before paginating the attendees" do
        paid_purchase.update!(created_at: 2.days.ago)
        create_list(:purchased_item, 21, purchase: paid_purchase.purchase, purchased_item: ticket, state: "paid")

        get event_event_attendees_path(event), params: { checked_in: "true" }, as: :json

        json = JSON.parse(response.body)
        expect(json.fetch("collection").pluck("id")).to eq([paid_purchase.id])
        expect(json.dig("metadata", "total_count")).to eq(1)
        expect(json.dig("metadata", "next_page")).to be_nil
      end

      it "only returns admissions belonging to the selected event" do
        other_event = create(:event, user: user)
        other_ticket = create(:event_ticket, event: other_event)
        other_purchase = create(:purchase, user: user, purchasable: other_event, state: "paid")
        create(:purchased_item, purchase: other_purchase, purchased_item: other_ticket, state: "paid", checked_in: true)

        get event_event_attendees_path(event), params: { checked_in: "true" }, as: :json

        expect(JSON.parse(response.body).fetch("collection").pluck("id")).to eq([paid_purchase.id])
      end

      it "excludes scanned tickets until their admission is registered" do
        post scan_event_admission_path(event, format: :json),
          params: { code: event_event_ticket_path(event, unchecked_item.signed_id) }, as: :json
        expect(response).to have_http_status(:success)

        get event_event_attendees_path(event), params: { checked_in: "true" }, as: :json

        expect(JSON.parse(response.body).fetch("collection").pluck("id")).to eq([paid_purchase.id])

        patch event_admission_path(event, format: :json),
          params: { signed_ticket_id: unchecked_item.signed_id, checked_in: true }, as: :json
        expect(response).to have_http_status(:success)

        get event_event_attendees_path(event), params: { checked_in: "true" }, as: :json

        expect(JSON.parse(response.body).fetch("collection").pluck("id")).to contain_exactly(paid_purchase.id, unchecked_item.id)
      end

      it "removes an attendee from validated results when admission is reverted" do
        patch event_admission_path(event, format: :json),
          params: { signed_ticket_id: paid_purchase.signed_id, checked_in: false }, as: :json
        expect(response).to have_http_status(:success)

        get event_event_attendees_path(event), params: { checked_in: "true" }, as: :json

        json = JSON.parse(response.body)
        expect(json.fetch("collection")).to be_empty
        expect(json.dig("metadata", "total_count")).to eq(0)
      end
    end

    describe "searching attendees" do
      let!(:matching_item) do
        attendee = create(:user, first_name: "Ana", last_name: "Perez",
          display_name: "Anita Stage", username: "ana-musica", email: "ana.perez@example.com")
        purchase = create(:purchase, user: attendee, purchasable: event, state: "paid",
          guest_email: "guest.search@example.com")
        create(:purchased_item, purchase: purchase, purchased_item: ticket, state: "paid")
      end

      {
        "display name" => "ANITA",
        "full name" => "ana perez",
        "username" => "ana-musica",
        "email" => "  ANA.PEREZ@  ",
        "guest email" => "GUEST.SEARCH@"
      }.each do |field, query|
        it "searches by #{field} without case sensitivity" do
          get event_event_attendees_path(event), params: { query: query }, as: :json

          expect(response).to have_http_status(:success)
          json = JSON.parse(response.body)
          expect(json.fetch("collection").pluck("id")).to eq([matching_item.id])
          expect(json.dig("metadata", "total_count")).to eq(1)
        end
      end

      it "returns no attendees when the query does not match" do
        get event_event_attendees_path(event), params: { query: "nobody-matches" }, as: :json

        json = JSON.parse(response.body)
        expect(json.fetch("collection")).to be_empty
        expect(json.dig("metadata", "total_count")).to eq(0)
      end

      it "combines the query with the ticket status filter" do
        create(:purchased_item, purchase: matching_item.purchase, purchased_item: ticket, state: "pending")

        get event_event_attendees_path(event), params: { query: "ana", status: "paid" }, as: :json

        json = JSON.parse(response.body)
        expect(json.fetch("collection").pluck("id")).to eq([matching_item.id])
        expect(json.dig("metadata", "total_count")).to eq(1)
      end

      it "searches all attendees before paginating" do
        matching_item.update!(created_at: 2.days.ago)
        create_list(:purchased_item, 21, purchase: paid_purchase.purchase, purchased_item: ticket, state: "paid")

        get event_event_attendees_path(event), params: { query: "ana" }, as: :json

        json = JSON.parse(response.body)
        expect(json.fetch("collection").pluck("id")).to eq([matching_item.id])
        expect(json.dig("metadata", "total_count")).to eq(1)
        expect(json.dig("metadata", "next_page")).to be_nil
      end

      it "only returns matches belonging to the selected event" do
        other_event = create(:event, user: user)
        other_ticket = create(:event_ticket, event: other_event)
        other_purchase = create(:purchase, user: matching_item.purchase.user, purchasable: other_event, state: "paid")
        create(:purchased_item, purchase: other_purchase, purchased_item: other_ticket, state: "paid")

        get event_event_attendees_path(event), params: { query: "ana" }, as: :json

        expect(JSON.parse(response.body).fetch("collection").pluck("id")).to eq([matching_item.id])
      end

      it "updates the results for a new query and restores the list when cleared" do
        {
          "ana.perez" => [matching_item.id],
          user.email => [pending_purchase.id, paid_purchase.id],
          "   " => [matching_item.id, pending_purchase.id, paid_purchase.id]
        }.each do |query, expected_ids|
          get event_event_attendees_path(event), params: { query: query }, as: :json

          expect(JSON.parse(response.body).fetch("collection").pluck("id")).to match_array(expected_ids)
        end
      end

      ["%", "_"].each do |query|
        it "treats #{query.inspect} as literal search text" do
          get event_event_attendees_path(event), params: { query: query }, as: :json

          expect(JSON.parse(response.body).fetch("collection")).to be_empty
        end
      end
    end
  end

  describe "GET /events/:event_id/event_attendees/export_csv" do
    it "enqueues a CSV export job for event owner" do
      expect {
        get export_csv_event_event_attendees_path(event, format: :json), as: :json
      }.to have_enqueued_job(EventAttendeesCsvExportJob).with(event.id, user.id, {})
      
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json['message']).to include('CSV export')
    end

    it "passes the applied search criteria to the export without pagination" do
      filters = { 'query' => ' ANA@EXAMPLE.COM ', 'status' => 'paid', 'checked_in' => 'true' }

      expect {
        get export_csv_event_event_attendees_path(event, format: :json),
          params: filters.merge('page' => 2, 'event_title' => 'Ignored'), as: :json
      }.to have_enqueued_job(EventAttendeesCsvExportJob).with(event.id, user.id, filters)

      expect(response).to have_http_status(:success)
    end

    it "preserves the filter for attendees without QR admission" do
      expect {
        get export_csv_event_event_attendees_path(event, format: :json),
          params: { checked_in: 'false' }, as: :json
      }.to have_enqueued_job(EventAttendeesCsvExportJob).with(event.id, user.id, { 'checked_in' => 'false' })
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

    it "allows grant admission staff to load tickets for invitations" do
      sign_in grant_admission_staff

      get tickets_event_event_attendees_path(event), as: :json

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json.dig('permissions', 'can_create_invitations')).to eq(true)
    end
  end

  describe "POST /events/:event_id/event_attendees/create_invitation" do
    it "requires a valid RUT when the selected ticket requests it" do
      ticket.update!(required_identifier: "rut")
      [nil, "12.345.678-4"].each do |rut|
        expect {
          post create_invitation_event_event_attendees_path(event, format: :json),
            params: { email: user.email, ticket_id: ticket.id, identifier_type: "rut", identifier_value: rut }, as: :json
        }.not_to change(Purchase, :count)
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    it "stores a normalized RUT for an invitation" do
      ticket.update!(required_identifier: "rut")
      post create_invitation_event_event_attendees_path(event, format: :json),
        params: { email: user.email, ticket_id: ticket.id, identifier_type: "rut", identifier_value: "12.345.678-5" }, as: :json

      expect(response).to have_http_status(:created)
      expect(Purchase.last).to have_attributes(identifier_type: "rut", identifier_value: "12345678-5", state: "paid")
    end

    it "includes the identifier requirement in invitation ticket options" do
      ticket.update!(required_identifier: "rut")
      get tickets_event_event_attendees_path(event, format: :json)

      expect(JSON.parse(response.body).fetch("collection").sole.fetch("required_identifier")).to eq("rut")
    end

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

    it "allows grant admission staff to create invitations" do
      sign_in grant_admission_staff

      expect {
        post create_invitation_event_event_attendees_path(event, format: :json),
             params: { email: 'grant@example.com', ticket_id: ticket.id },
             as: :json
      }.to change(Purchase, :count).by(1)

      expect(response).to have_http_status(:created)
    end

    it "denies admission-only staff from creating invitations" do
      sign_in admission_staff

      post create_invitation_event_event_attendees_path(event, format: :json),
           params: { email: 'readonly@example.com', ticket_id: ticket.id },
           as: :json

      expect(response).to have_http_status(:unauthorized)
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

    it "allows admin staff to process refunds" do
      initial_qty = ticket.qty
      sign_in admin_staff

      post refund_event_event_attendee_path(event, paid_item), as: :json

      expect(response).to have_http_status(:ok)
      expect(paid_item.reload.state).to eq('refunded')
      expect(ticket.reload.qty).to eq(initial_qty + 1)
    end

    it "denies grant admission staff from processing refunds" do
      sign_in grant_admission_staff

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
