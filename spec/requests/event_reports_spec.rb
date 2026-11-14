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
      expect(json.fetch("invitation")).to eq("count" => 0, "total" => 0.0)
      expect(json.dig("event", "title")).to eq(event.title)

      ticket_types = json.fetch("ticket_types").index_by { |ticket_type| ticket_type.fetch("title") }
      expect(ticket_types.dig("General", "count")).to eq(1)
      expect(ticket_types.dig("General", "revenue")).to eq(1500.0)
      expect(ticket_types.dig("General", "paid")).to eq("count" => 1, "total" => 1500.0)
      expect(ticket_types.fetch("General")).to include("available_quantity" => 10, "total_quantity" => 11, "sales_percentage" => 9.1)
      expect(ticket_types.dig("VIP", "count")).to eq(0)
      expect(ticket_types.dig("VIP", "revenue")).to eq(0.0)
      expect(ticket_types.dig("VIP", "pending")).to eq("count" => 1, "total" => 2500.0)
      expect(ticket_types.fetch("VIP")).to include("available_quantity" => 9, "total_quantity" => 10, "sales_percentage" => 0.0)
      expect(ticket_types.dig("Early bird", "count")).to eq(0)
      expect(ticket_types.dig("Early bird", "revenue")).to eq(0.0)
      expect(ticket_types.fetch("Early bird")).to include("available_quantity" => 10, "total_quantity" => 10, "sales_percentage" => 0.0)
    end

    it "counts paid tickets at their purchase price and keeps pending and refunded tickets separate" do
      create(:purchased_item, purchase: purchase, purchased_item: ticket, state: "paid", price: 1200, currency: "clp")
      create(:purchased_item, purchase: purchase, purchased_item: ticket, state: "refunded", price: 1500, currency: "clp")
      create(:purchased_item, purchase: pending_purchase, purchased_item: ticket, state: "pending", price: 1500, currency: "clp")
      create(:purchased_item, purchase: pending_purchase, purchased_item: ticket, state: "pending", price: 1500, currency: "clp", created_at: 2.days.ago)
      ticket.update!(price: 2000, qty: 8)
      sign_in owner

      get event_event_report_path(event, "general_stats", format: :json)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      general = json.fetch("ticket_types").find { |ticket_type| ticket_type.fetch("id") == ticket.id }

      expect(general).to include(
        "count" => 2,
        "revenue" => 2700.0,
        "available_quantity" => 7,
        "total_quantity" => 10,
        "sales_percentage" => 20.0,
        "paid" => { "count" => 2, "total" => 2700.0 },
        "pending" => { "count" => 2, "total" => 3000.0 },
        "refunded" => { "count" => 1, "total" => 1500.0 }
      )
      expect(json.fetch("ticket_types").sum { |ticket_type| ticket_type.fetch("count") }).to eq(json.dig("paid", "count"))
      expect(json.fetch("ticket_types").sum { |ticket_type| ticket_type.fetch("revenue") }).to eq(json.dig("paid", "total"))
    end

    it "uses real sales and stock in reports when simulated stock is configured" do
      ticket.update!(simulated_stock: 1)
      sign_in owner

      get event_event_report_path(event, "general_stats", format: :json)

      expect(response).to have_http_status(:ok)
      general = JSON.parse(response.body).fetch("ticket_types").find { |ticket_type| ticket_type.fetch("id") == ticket.id }
      expect(general).to include("count" => 1, "available_quantity" => 10, "total_quantity" => 11, "sales_percentage" => 9.1)
    end

    it "shows full sell-through for sold out tickets and zero for empty inventory without sales" do
      ticket.update!(qty: 0)
      unsold_ticket.update!(qty: 0)
      sign_in owner

      get event_event_report_path(event, "general_stats", format: :json)

      expect(response).to have_http_status(:ok)
      ticket_types = JSON.parse(response.body).fetch("ticket_types").index_by { |ticket_type| ticket_type.fetch("id") }
      expect(ticket_types.fetch(ticket.id)).to include("available_quantity" => 0, "total_quantity" => 1, "sales_percentage" => 100.0)
      expect(ticket_types.fetch(unsold_ticket.id)).to include("available_quantity" => 0, "total_quantity" => 0, "sales_percentage" => 0.0)
    end

    it "ignores expired reservations and excludes archived stock from availability" do
      pending_item.update!(created_at: 2.days.ago)
      unsold_ticket.destroy!
      sign_in owner

      get event_event_report_path(event, "general_stats", format: :json)

      expect(response).to have_http_status(:ok)
      ticket_types = JSON.parse(response.body).fetch("ticket_types").index_by { |ticket_type| ticket_type.fetch("id") }
      expect(ticket_types.fetch(vip_ticket.id)).to include("available_quantity" => 10, "total_quantity" => 10, "sales_percentage" => 0.0)
      expect(ticket_types.fetch(unsold_ticket.id)).to include("available_quantity" => 0, "total_quantity" => 0, "sales_percentage" => 0.0)
    end

    it "counts confirmed free tickets as sold without adding revenue" do
      unsold_ticket.update!(price: 0)
      create(:purchased_item, purchase: purchase, purchased_item: unsold_ticket, state: "paid", price: 0, currency: "clp")
      sign_in owner

      get event_event_report_path(event, "general_stats", format: :json)

      expect(response).to have_http_status(:ok)
      free_ticket = JSON.parse(response.body).fetch("ticket_types").find { |ticket_type| ticket_type.fetch("id") == unsold_ticket.id }
      expect(free_ticket).to include("count" => 1, "revenue" => 0.0)
    end

    it "reports invitations separately from sales while accounting for the stock they use" do
      sign_in owner
      perform_enqueued_jobs do
        post create_invitation_event_event_attendees_path(event, format: :json),
          params: { email: buyer.email, ticket_id: ticket.id }, as: :json
      end
      expect(response).to have_http_status(:created)

      get event_event_report_path(event, "general_stats", format: :json)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.fetch("paid")).to eq("count" => 1, "total" => 1500.0)
      expect(json.fetch("invitation")).to eq("count" => 1, "total" => 0.0)
      ticket_stats = json.fetch("ticket_types").find { |stats| stats.fetch("id") == ticket.id }
      expect(ticket_stats).to include(
        "count" => 1,
        "revenue" => 1500.0,
        "invitation" => { "count" => 1, "total" => 0.0 },
        "available_quantity" => 9,
        "total_quantity" => 11,
        "sales_percentage" => 9.1
      )

      get event_event_report_path(event, "orders_distribution", format: :json)
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).fetch("distribution")).to eq("paid" => 1, "invitation" => 1, "pending" => 1)
    end

    it "reports only paid tickets as revenue and sales over time within the requested dates" do
      report_date = Date.current
      purchased_item.update!(created_at: report_date.noon)
      pending_item.update!(created_at: report_date.noon)
      create(:purchased_item, purchase: purchase, purchased_item: ticket, state: "paid", price: 1500, currency: "clp", created_at: report_date.yesterday.noon)
      create(:purchased_item, purchase: purchase, purchased_item: ticket, state: "refunded", price: 1500, currency: "clp", created_at: report_date.noon)
      sign_in manager

      get event_event_report_path(event, "revenue_over_time", format: :json), params: { start_date: report_date.to_s, end_date: report_date.to_s }

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to include(
        "total_revenue" => 1500.0,
        "total_orders" => 1,
        "daily_revenue" => { report_date.to_s => "1500.0" },
        "daily_orders" => { report_date.to_s => 1 }
      )
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
