require "rails_helper"

RSpec.describe "EventAdmissions", type: :request do
  let(:owner) { create(:user) }
  let(:manager) { create(:user) }
  let(:buyer) { create(:user) }
  let(:stranger) { create(:user) }
  let(:event) { create(:event, user: owner, ticket_currency: "clp") }
  let(:ticket) { create(:event_ticket, event: event, title: "General", price: 1500, qty: 10) }
  let(:purchase_state) { "paid" }
  let(:item_state) { "paid" }
  let(:checked_in) { false }
  let(:checked_in_at) { nil }
  let(:purchase) do
    create(:purchase, user: buyer, purchasable: event, state: purchase_state, price: ticket.price, currency: "clp")
  end
  let!(:purchased_item) do
    create(
      :purchased_item,
      purchase: purchase,
      purchased_item: ticket,
      state: item_state,
      checked_in: checked_in,
      checked_in_at: checked_in_at,
      price: ticket.price,
      currency: "clp"
    )
  end

  before do
    owner.confirm
    manager.confirm
    buyer.confirm
    stranger.confirm
    create(:event_host, event: event, user: manager, event_manager: true)
  end

  describe "GET /events/:event_id/admission" do
    it "returns the admission summary for event managers" do
      sign_in manager

      get event_admission_path(event, format: :json), as: :json

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)

      expect(json.dig("event", "slug")).to eq(event.slug)
      expect(json.dig("summary", "total_paid_count")).to eq(1)
      expect(json.dig("summary", "checked_in_count")).to eq(0)
    end
  end

  describe "POST /events/:event_id/admission/scan" do
    let(:scan_path) { scan_event_admission_path(event, format: :json) }

    it "validates a paid event ticket QR for managers" do
      sign_in manager

      post scan_path,
           params: { code: event_event_ticket_path(event, purchased_item.signed_id) },
           as: :json

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)

      expect(json.dig("ticket", "admission_status")).to eq("valid")
      expect(json.dig("ticket", "ticket_title")).to eq(ticket.title)
      expect(json.dig("ticket", "attendee_email")).to eq(buyer.email)
    end

    it "rejects users who are not event managers" do
      sign_in stranger

      post scan_path,
           params: { code: event_event_ticket_path(event, purchased_item.signed_id) },
           as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to include("error" => "Unauthorized")
    end

    it "rejects QR codes from other events" do
      other_event = create(:event, user: owner, ticket_currency: "clp")
      other_ticket = create(:event_ticket, event: other_event, title: "VIP", price: 3000, qty: 5)
      other_purchase = create(:purchase, user: buyer, purchasable: other_event, state: "paid", price: other_ticket.price, currency: "clp")
      other_item = create(:purchased_item, purchase: other_purchase, purchased_item: other_ticket, state: "paid", price: other_ticket.price, currency: "clp")

      sign_in owner

      post scan_path,
           params: { code: event_event_ticket_path(other_event, other_item.signed_id) },
           as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)).to include("error" => "Este QR pertenece a otro evento")
    end
  end

  describe "PATCH /events/:event_id/admission" do
    let(:update_path) { event_admission_path(event, format: :json) }

    it "checks in a paid ticket for managers" do
      sign_in manager

      patch update_path,
            params: { signed_ticket_id: purchased_item.signed_id, checked_in: true },
            as: :json

      expect(response).to have_http_status(:ok)
      expect(purchased_item.reload.checked_in).to be(true)
      expect(purchased_item.checked_in_at).to be_present

      json = JSON.parse(response.body)
      expect(json.dig("ticket", "admission_status")).to eq("already_checked_in")
      expect(json.dig("summary", "checked_in_count")).to eq(1)
    end

    it "allows reverting a previous check-in" do
      sign_in owner
      purchased_item.update!(checked_in: true, checked_in_at: 15.minutes.ago)

      patch update_path,
            params: { signed_ticket_id: purchased_item.signed_id, checked_in: false },
            as: :json

      expect(response).to have_http_status(:ok)
      expect(purchased_item.reload.checked_in).to be(false)
      expect(purchased_item.checked_in_at).to be_nil
    end

    it "returns an error for tickets that are not paid" do
      sign_in owner
      purchase.update!(state: "pending")
      purchased_item.update!(state: "pending")

      patch update_path,
            params: { signed_ticket_id: purchased_item.signed_id, checked_in: true },
            as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)).to include("errors" => ["Only paid tickets can be checked in"])
    end
  end
end
