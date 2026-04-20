require "rails_helper"

RSpec.describe "Newsletter broadcast metrics", type: :request do
  describe "POST /newsletter/broadcasts/:id/clear_metrics.json" do
    let(:user) do
      create(
        :user,
        confirmed_at: Time.current,
        can_send_newsletter: true,
        newsletter_broadcast_recipient_limit: 100
      )
    end
    let!(:broadcast) do
      Newsletter::Broadcast.create!(
        user: user,
        name: "Campaña abril",
        status: "completed",
        total_recipients: 1,
        sent_recipients: 1
      )
    end
    let!(:recipient) do
      Newsletter::BroadcastRecipient.create!(
        broadcast: broadcast,
        position: 0,
        email: "one@example.com",
        first_name: "One",
        status: "sent"
      )
    end

    before do
      sign_in user
    end

    it "removes tracking events and returns a reset metrics payload" do
      Newsletter::BroadcastEvent.create!(
        broadcast: broadcast,
        recipient: recipient,
        event_type: "open"
      )
      Newsletter::BroadcastEvent.create!(
        broadcast: broadcast,
        recipient: recipient,
        event_type: "click",
        tracked_url: "https://example.com/promo"
      )

      post "/newsletter/broadcasts/#{broadcast.id}/clear_metrics.json"

      expect(response).to have_http_status(:ok)
      expect(broadcast.events.count).to eq(0)

      payload = JSON.parse(response.body)
      expect(payload.dig("broadcast", "metrics", "total_opens")).to eq(0)
      expect(payload.dig("broadcast", "metrics", "total_clicks")).to eq(0)
      expect(payload.dig("broadcast", "recipients", 0, "open_count")).to eq(0)
      expect(payload.dig("broadcast", "recipients", 0, "click_count")).to eq(0)
    end

    it "rejects clearing metrics while the broadcast is in progress" do
      broadcast.update!(status: "sending")

      post "/newsletter/broadcasts/#{broadcast.id}/clear_metrics.json"

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)).to include(
        "errors" => include("No puedes limpiar las métricas de un broadcast en progreso")
      )
    end
  end
end
