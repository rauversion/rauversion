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
