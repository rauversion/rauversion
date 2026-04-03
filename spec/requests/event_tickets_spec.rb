require "rails_helper"

RSpec.describe "EventTickets", type: :request do
  describe "PUT /events/:event_id/event_tickets/:id" do
    let(:owner) { create(:user) }
    let(:manager) { create(:user) }
    let(:admission_staff) { create(:user) }
    let(:buyer) { create(:user) }
    let(:stranger) { create(:user) }
    let(:event) { create(:event, user: owner, ticket_currency: "usd") }
    let(:ticket) { create(:event_ticket, event: event, title: "General", price: 50, qty: 10) }
    let(:purchase) do
      create(:purchase, user: buyer, purchasable: event, state: purchase_state, price: ticket.price, currency: "usd")
    end
    let(:purchase_state) { "paid" }
    let(:item_state) { "paid" }
    let(:checked_in) { false }
    let(:checked_in_at) { nil }
    let!(:purchased_item) do
      create(
        :purchased_item,
        purchase: purchase,
        purchased_item: ticket,
        state: item_state,
        price: ticket.price,
        currency: "usd",
        checked_in: checked_in,
        checked_in_at: checked_in_at
      )
    end

    let(:request_path) { event_event_ticket_path(event, purchased_item.signed_id, format: :json) }

    before do
      owner.confirm
      manager.confirm
      admission_staff.confirm
      buyer.confirm
      stranger.confirm
    end

    it "allows an event manager to check in a paid ticket" do
      create(:event_host, event: event, user: manager, access_role: "admin")
      sign_in manager

      put request_path, params: { checked_in: true }, as: :json

      expect(response).to have_http_status(:ok)
      expect(purchased_item.reload.checked_in).to be(true)
      expect(purchased_item.checked_in_at).to be_present

      json = JSON.parse(response.body)
      expect(json.dig("event_ticket", "purchased_item", "checked_in")).to be(true)
    end

    it "allows admission staff to check in a paid ticket" do
      create(:event_host, event: event, user: admission_staff, access_role: "admission")
      sign_in admission_staff

      put request_path, params: { checked_in: true }, as: :json

      expect(response).to have_http_status(:ok)
      expect(purchased_item.reload.checked_in).to be(true)
    end

    it "rejects users who are not event managers" do
      sign_in stranger

      put request_path, params: { checked_in: true }, as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(purchased_item.reload.checked_in).to be(false)
      expect(JSON.parse(response.body)).to include("error" => "Unauthorized")
    end

    it "rejects check in for pending tickets" do
      sign_in owner

      purchase.update!(state: "pending")
      purchased_item.update!(state: "pending")

      put request_path, params: { checked_in: true }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(purchased_item.reload.checked_in).to be(false)
      expect(JSON.parse(response.body)).to include("errors" => ["Only paid tickets can be checked in"])
    end

    it "applies check in idempotently using the checked_in parameter" do
      sign_in owner
      purchased_item.update!(checked_in: true, checked_in_at: 30.minutes.ago)
      original_checked_in_at = purchased_item.checked_in_at

      put request_path, params: { checked_in: true }, as: :json

      expect(response).to have_http_status(:ok)
      expect(purchased_item.reload.checked_in).to be(true)
      expect(purchased_item.checked_in_at.to_i).to eq(original_checked_in_at.to_i)
    end
  end
end
