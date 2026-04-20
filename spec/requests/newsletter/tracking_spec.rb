require "rails_helper"
require "cgi"
require "uri"

RSpec.describe "Newsletter tracking", type: :request do
  let(:user) { create(:user, confirmed_at: Time.current, can_send_newsletter: true) }
  let(:broadcast) do
    Newsletter::Broadcast.create!(
      user: user,
      name: "Campaign",
      status: "completed",
      total_recipients: 1,
      sent_recipients: 1
    )
  end
  let(:recipient) do
    Newsletter::BroadcastRecipient.create!(
      broadcast: broadcast,
      position: 0,
      email: "hello@example.com",
      first_name: "Hello",
      status: "sent"
    )
  end

  describe "GET /newsletter/track/open" do
    it "records the open and returns a tracking pixel" do
      token = CGI.parse(URI.parse(Newsletter::BroadcastTracking.open_url_for(recipient)).query).fetch("token").first

      get "/newsletter/track/open", params: { token: token }, headers: {
        "REMOTE_ADDR" => "203.0.113.5",
        "HTTP_USER_AGENT" => "RSpec",
      }

      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("image/gif")

      event = Newsletter::BroadcastEvent.last
      expect(event.event_type).to eq("open")
      expect(event.broadcast).to eq(broadcast)
      expect(event.recipient).to eq(recipient)
      expect(event.ip_address).to eq("203.0.113.5")
      expect(event.user_agent).to eq("RSpec")
    end
  end

  describe "GET /newsletter/track/click" do
    it "records the click and redirects to the original url" do
      target_url = "https://example.com/promo?code=abc"
      token = CGI.parse(URI.parse(Newsletter::BroadcastTracking.click_url_for(recipient: recipient, url: target_url)).query).fetch("token").first

      get "/newsletter/track/click", params: { token: token }, headers: {
        "REMOTE_ADDR" => "203.0.113.9",
        "HTTP_USER_AGENT" => "RSpec Click",
      }

      expect(response).to have_http_status(:found)
      expect(response.location).to eq(target_url)

      event = Newsletter::BroadcastEvent.last
      expect(event.event_type).to eq("click")
      expect(event.tracked_url).to eq(target_url)
      expect(event.ip_address).to eq("203.0.113.9")
      expect(event.user_agent).to eq("RSpec Click")
    end

    it "returns not found for an invalid token" do
      get "/newsletter/track/click", params: { token: "invalid" }

      expect(response).to have_http_status(:not_found)
    end
  end
end
