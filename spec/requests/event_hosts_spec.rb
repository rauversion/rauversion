require "rails_helper"

RSpec.describe "EventHosts", type: :request do
  describe "PUT /events/:event_id/event_hosts/:id.json" do
    let(:owner) { create(:user, confirmed_at: Time.current) }
    let(:event) { create(:event, user: owner) }

    it "returns persisted user email and source metadata" do
      invited_user = create(
        :user,
        email: "manager@example.com",
        invitation_sent_at: 1.day.ago,
        invitation_accepted_at: nil
      )
      event_host = create(:event_host, event: event, user: invited_user, access_role: "admin")

      sign_in owner

      put event_event_host_path(event, event_host, format: :json), params: {
        event_host: {
          name: "Manager Updated",
          access_role: "admission"
        }
      }

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body).fetch("event_host")
      expect(payload).to include(
        "email" => "manager@example.com",
        "user_id" => invited_user.id,
        "record_type" => "user",
        "invitation_pending" => true,
        "name" => "Manager Updated",
        "access_role" => "admission"
      )
      expect(payload.dig("user", "email")).to eq("manager@example.com")
    end
  end
end
