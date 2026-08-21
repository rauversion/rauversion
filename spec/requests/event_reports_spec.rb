require "rails_helper"

RSpec.describe "EventReports", type: :request do
  let(:owner) { create(:user, confirmed_at: Time.current) }
  let(:manager) { create(:user, confirmed_at: Time.current) }
  let(:admission_staff) { create(:user, confirmed_at: Time.current) }
  let(:stranger) { create(:user, confirmed_at: Time.current) }
  let(:buyer) { create(:user, confirmed_at: Time.current) }
  let(:event) { create(:event, user: owner, ticket_currency: "clp") }
  let(:ticket) { create(:event_ticket, event: event, title: "General", price: 1500, qty: 10) }
  let!(:vip_ticket) { create(:event_ticket, event: event, title: "VIP", price: 2500, qty: 10) }
  let!(:unsold_ticket) { create(:event_ticket, event: event, title: "Early bird", price: 1000, qty: 10) }
  let!(:purchase) do
    create(:purchase, user: buyer, purchasable: event, state: "paid", price: ticket.price, currency: "clp")
  end
  let!(:purchased_item) do
    create(
      :purchased_item,
      purchase: purchase,
      purchased_item: ticket,
      state: "paid",
      price: ticket.price,
      currency: "clp"
    )
  end
  let!(:pending_purchase) do
    create(:purchase, user: buyer, purchasable: event, state: "pending", price: vip_ticket.price, currency: "clp")
  end
  let!(:pending_item) do
    create(
      :purchased_item,
      purchase: pending_purchase,
      purchased_item: vip_ticket,
      state: "pending",
      price: vip_ticket.price,
      currency: "clp"
    )
  end

  before do
    create(:event_host, event: event, user: manager, access_role: "admin")
    create(:event_host, event: event, user: admission_staff, access_role: "admission")
  end

  describe "GET /events/:event_id/event_reports/:id" do
    it "returns report data for event managers" do
      sign_in manager

      get event_event_report_path(event, "general_stats", format: :json)

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      expect(json.dig("paid", "count")).to eq(1)
      expect(json.dig("paid", "total")).to eq(1500.0)
      expect(json.dig("event", "title")).to eq(event.title)

      ticket_types = json.fetch("ticket_types").index_by { |ticket_type| ticket_type.fetch("title") }
      expect(ticket_types.dig("General", "revenue")).to eq(1500.0)
      expect(ticket_types.dig("General", "paid")).to eq("count" => 1, "total" => 1500.0)
      expect(ticket_types.dig("VIP", "revenue")).to eq(2500.0)
      expect(ticket_types.dig("VIP", "pending")).to eq("count" => 1, "total" => 2500.0)
      expect(ticket_types.dig("Early bird", "revenue")).to eq(0.0)
    end

    it "rejects users outside the event team" do
      sign_in stranger

      get event_event_report_path(event, "general_stats", format: :json)

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to include("error" => "Unauthorized")
    end

    it "rejects staff without reports permission" do
      sign_in admission_staff

      get event_event_report_path(event, "general_stats", format: :json)

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to include("error" => "Unauthorized")
    end
  end
end
