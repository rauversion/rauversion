require "rails_helper"

RSpec.describe "Events", type: :request do
  describe "GET /events/:id/edit.json" do
    let(:user) { create(:user, confirmed_at: Time.current) }
    let(:event) do
      create(
        :event,
        user: user,
        timezone: "",
        event_start: Time.utc(2026, 4, 1, 20, 0, 0),
        event_ends: Time.utc(2026, 4, 2, 1, 0, 0)
      )
    end

    before do
      sign_in user
    end

    it "returns the edit payload even when timezone is blank" do
      get edit_event_path(event, format: :json)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)

      expect(json["id"]).to eq(event.id)
      expect(json["event_dates_formatted"]).to be_present
    end
  end

  describe "GET /index" do
    it "responds successfully" do
      get events_path

      expect(response).to have_http_status(:ok)
    end
  end
end
