require "rails_helper"

RSpec.describe "Events", type: :request do
  describe "GET /events/:id/edit.json" do
    let(:user) { create(:user, confirmed_at: Time.current) }
    let(:manager) { create(:user, confirmed_at: Time.current) }
    let(:event) do
      create(
        :event,
        user: user,
        timezone: "",
        event_start: Time.utc(2026, 4, 1, 20, 0, 0),
        event_ends: Time.utc(2026, 4, 2, 1, 0, 0)
      )
    end

    it "returns the edit payload even when timezone is blank" do
      sign_in user

      get edit_event_path(event, format: :json)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)

      expect(json["id"]).to eq(event.id)
      expect(json["event_dates_formatted"]).to be_present
    end

    it "allows event managers to open the edit shell" do
      create(:event_host, event: event, user: manager, access_role: "admin")
      sign_in manager

      get edit_event_path(event)

      expect(response).to have_http_status(:ok)
    end

    it "does not expose the owner edit payload to event managers" do
      create(:event_host, event: event, user: manager, access_role: "admin")
      sign_in manager

      get edit_event_path(event, format: :json)

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to include("error" => "Unauthorized")
    end

    it "includes email and source metadata for event hosts in the edit payload" do
      invited_user = create(
        :user,
        email: "gestor-invitado@example.com",
        invitation_sent_at: 1.day.ago,
        invitation_accepted_at: nil
      )
      invited_host = create(:event_host, event: event, user: invited_user, name: nil, access_role: "admin")
      standalone_host = create(:event_host, event: event, user: nil, name: "Gestor externo", access_role: "host")

      sign_in user

      get edit_event_path(event, format: :json)

      expect(response).to have_http_status(:ok)

      event_hosts = JSON.parse(response.body).fetch("event_hosts")
      invited_payload = event_hosts.find { |host| host.fetch("id") == invited_host.id }
      standalone_payload = event_hosts.find { |host| host.fetch("id") == standalone_host.id }

      expect(invited_payload).to include(
        "email" => "gestor-invitado@example.com",
        "user_id" => invited_user.id,
        "record_type" => "user",
        "invitation_pending" => true
      )
      expect(invited_payload.dig("user", "email")).to eq("gestor-invitado@example.com")

      expect(standalone_payload).to include(
        "email" => nil,
        "user_id" => nil,
        "record_type" => "event_data",
        "invitation_pending" => false
      )
    end

    it "includes the event tracking settings" do
      event.update!(
        google_analytics_id: "G-ABC123DEF4",
        meta_pixel_id: "123456789012345",
        google_tag_manager_id: "GTM-ABC1234"
      )
      sign_in user

      get edit_event_path(event, format: :json)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to include(
        "google_analytics_id" => "G-ABC123DEF4",
        "meta_pixel_id" => "123456789012345",
        "google_tag_manager_id" => "GTM-ABC1234"
      )
    end
  end

  describe "PUT /events/:id.json" do
    let(:user) { create(:user, confirmed_at: Time.current) }
    let(:event) { create(:event, user: user, ticket_currency: "usd") }

    before do
      sign_in user
    end

    it "returns persisted ticket IDs so subsequent saves update instead of duplicate" do
      expect {
        put event_path(event, format: :json), params: {
          event: {
            ticket_currency: "usd",
            event_tickets_attributes: [{
              title: "General",
              short_description: "General admission",
              price: 10,
              qty: 20
            }]
          }
        }, as: :json
      }.to change { event.event_tickets.count }.by(1)

      expect(response).to have_http_status(:ok)
      persisted_ticket = JSON.parse(response.body).fetch("tickets").sole

      expect(persisted_ticket.fetch("id")).to be_present

      expect {
        put event_path(event, format: :json), params: {
          event: {
            ticket_currency: "usd",
            event_tickets_attributes: [{
              id: persisted_ticket.fetch("id"),
              title: "General actualizado",
              short_description: "General admission",
              price: 10,
              qty: 20
            }]
          }
        }, as: :json
      }.not_to change { event.event_tickets.count }

      expect(response).to have_http_status(:ok)
      expect(event.event_tickets.sole.reload.title).to eq("General actualizado")
    end

    it "returns the remaining tickets after deleting one" do
      ticket = create(:event_ticket, event: event)

      expect {
        put event_path(event, format: :json), params: {
          event: {
            event_tickets_attributes: [{
              id: ticket.id,
              _destroy: true
            }]
          }
        }, as: :json
      }.to change { event.event_tickets.count }.from(1).to(0)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).fetch("tickets")).to eq([])
    end

    it "persists the ticket order sent by the editor" do
      general_ticket = create(:event_ticket, event: event, title: "General")
      vip_ticket = create(:event_ticket, event: event, title: "VIP")

      put event_path(event, format: :json), params: {
        event: {
          event_tickets_attributes: [
            { id: general_ticket.id, position: 2 },
            { id: vip_ticket.id, position: 1 }
          ]
        }
      }, as: :json

      expect(response).to have_http_status(:ok)
      expect(event.reload.event_tickets.pluck(:id)).to eq([vip_ticket.id, general_ticket.id])

      response_ticket_ids = JSON.parse(response.body).fetch("tickets").map { |ticket| ticket.fetch("id") }
      expect(response_ticket_ids).to eq([vip_ticket.id, general_ticket.id])
    end

    it "persists tracking settings and returns them in the update payload" do
      put event_path(event, format: :json), params: {
        event: {
          google_analytics_id: "g-abc123def4",
          meta_pixel_id: "123456789012345",
          google_tag_manager_id: "gtm-abc1234"
        }
      }, as: :json

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).fetch("event")).to include(
        "google_analytics_id" => "G-ABC123DEF4",
        "meta_pixel_id" => "123456789012345",
        "google_tag_manager_id" => "GTM-ABC1234"
      )
    end

    it "returns tracking validation errors for the React form" do
      put event_path(event, format: :json), params: {
        event: {
          meta_pixel_id: "not-a-pixel"
        }
      }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body).fetch("errors")).to include("meta_pixel_id")
    end
  end

  describe "GET /events/:id.json" do
    let(:user) { create(:user, confirmed_at: Time.current) }
    let(:event) do
      create(
        :event,
        user: user,
        state: "published",
        google_analytics_id: "G-ABC123DEF4",
        meta_pixel_id: "123456789012345",
        google_tag_manager_id: "GTM-ABC1234"
      )
    end

    it "exposes tracking IDs to the React event page for default and custom sites" do
      get event_path(event, format: :json)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to include(
        "google_analytics_id" => "G-ABC123DEF4",
        "meta_pixel_id" => "123456789012345",
        "google_tag_manager_id" => "GTM-ABC1234"
      )
    end
  end

  describe "GET /index" do
    it "responds successfully" do
      get events_path

      expect(response).to have_http_status(:ok)
    end
  end

  describe "GET /events/mine.json" do
    let(:user) { create(:user, confirmed_at: Time.current) }
    let(:other_owner) { create(:user, confirmed_at: Time.current) }
    let!(:owned_draft_event) { create(:event, user: user, state: "draft", title: "Owned Draft Event") }
    let!(:owned_published_event) { create(:event, user: user, state: "published", title: "Owned Published Event") }
    let!(:managed_event) { create(:event, user: other_owner, state: "draft", title: "Managed Draft Event") }
    let!(:non_manager_hosted_event) { create(:event, user: other_owner, state: "draft", title: "Hosted But Not Managed") }

    before do
      create(:event_host, event: managed_event, user: user, access_role: "admission")
      create(:event_host, event: non_manager_hosted_event, user: user, access_role: "host")
      sign_in user
    end

    it "returns owned and managed events in the all tab" do
      get mine_events_path(format: :json), params: { tab: "all" }

      expect(response).to have_http_status(:ok)

      ids = JSON.parse(response.body).fetch("collection").map { |event| event.fetch("id") }
      expect(ids).to include(owned_draft_event.id, owned_published_event.id, managed_event.id)
      expect(ids).not_to include(non_manager_hosted_event.id)
    end

    it "defaults to the all tab when no tab is provided" do
      get mine_events_path(format: :json)

      expect(response).to have_http_status(:ok)

      ids = JSON.parse(response.body).fetch("collection").map { |event| event.fetch("id") }
      expect(ids).to include(owned_draft_event.id, owned_published_event.id, managed_event.id)
      expect(ids).not_to include(non_manager_hosted_event.id)
    end

    it "returns only events created by the current user in the owned tab" do
      get mine_events_path(format: :json), params: { tab: "owned" }

      expect(response).to have_http_status(:ok)

      ids = JSON.parse(response.body).fetch("collection").map { |event| event.fetch("id") }
      expect(ids).to include(owned_draft_event.id, owned_published_event.id)
      expect(ids).not_to include(managed_event.id, non_manager_hosted_event.id)
    end

    it "returns only manager-assigned events in the manager tab" do
      get mine_events_path(format: :json), params: { tab: "manager" }

      expect(response).to have_http_status(:ok)

      ids = JSON.parse(response.body).fetch("collection").map { |event| event.fetch("id") }
      expect(ids).to eq([managed_event.id])
    end
  end
end
