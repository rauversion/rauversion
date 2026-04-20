require "rails_helper"

RSpec.describe Newsletter::BroadcastMetrics do
  include ActiveSupport::Testing::TimeHelpers

  describe "#as_json" do
    let(:user) { create(:user, confirmed_at: Time.current, can_send_newsletter: true) }
    let(:broadcast) do
      Newsletter::Broadcast.create!(
        user: user,
        name: "Campaña abril",
        status: "completed",
        total_recipients: 4,
        sent_recipients: 3,
        failed_recipients: 1
      )
    end
    let!(:first_recipient) do
      Newsletter::BroadcastRecipient.create!(
        broadcast: broadcast,
        position: 0,
        email: "one@example.com",
        first_name: "One",
        status: "sent"
      )
    end
    let!(:second_recipient) do
      Newsletter::BroadcastRecipient.create!(
        broadcast: broadcast,
        position: 1,
        email: "two@example.com",
        first_name: "Two",
        status: "sent"
      )
    end
    let!(:third_recipient) do
      Newsletter::BroadcastRecipient.create!(
        broadcast: broadcast,
        position: 2,
        email: "three@example.com",
        first_name: "Three",
        status: "sent"
      )
    end

    before do
      travel_to(Time.zone.parse("2026-04-19 10:00:00")) do
        Newsletter::BroadcastEvent.create!(
          broadcast: broadcast,
          recipient: first_recipient,
          event_type: "open"
        )
        Newsletter::BroadcastEvent.create!(
          broadcast: broadcast,
          recipient: first_recipient,
          event_type: "open"
        )
        Newsletter::BroadcastEvent.create!(
          broadcast: broadcast,
          recipient: first_recipient,
          event_type: "click",
          tracked_url: "https://example.com/a"
        )
      end

      travel_to(Time.zone.parse("2026-04-20 11:30:00")) do
        Newsletter::BroadcastEvent.create!(
          broadcast: broadcast,
          recipient: second_recipient,
          event_type: "click",
          tracked_url: "https://example.com/a"
        )
      end
    end

    after do
      travel_back
    end

    it "aggregates delivery and engagement metrics" do
      metrics = described_class.new(broadcast)
      payload = metrics.as_json
      aggregates = metrics.recipient_aggregates

      expect(payload[:unique_open_recipients]).to eq(1)
      expect(payload[:total_opens]).to eq(2)
      expect(payload[:unique_click_recipients]).to eq(2)
      expect(payload[:total_clicks]).to eq(2)
      expect(payload[:open_rate]).to eq(33.3)
      expect(payload[:click_rate]).to eq(66.7)
      expect(payload[:click_to_open_rate]).to eq(200.0)
      expect(payload[:delivery_breakdown].map { |slice| [slice[:key], slice[:value]] }).to include(
        ["delivered", 3],
        ["failed", 1]
      )
      expect(payload[:engagement_breakdown].map { |slice| [slice[:key], slice[:value]] }).to include(
        ["clicked", 2],
        ["no_engagement", 1]
      )
      expect(payload[:activity_series]).to eq([
        { date: "2026-04-19", opens: 2, clicks: 1 },
        { date: "2026-04-20", opens: 0, clicks: 1 },
      ])
      expect(payload[:top_links]).to contain_exactly(
        { url: "https://example.com/a", clicks: 2, unique_clicks: 2 }
      )

      expect(aggregates[first_recipient.id][:open_count]).to eq(2)
      expect(aggregates[first_recipient.id][:click_count]).to eq(1)
      expect(aggregates[second_recipient.id][:open_count]).to eq(0)
      expect(aggregates[second_recipient.id][:click_count]).to eq(1)
      expect(aggregates[third_recipient.id][:open_count]).to eq(0)
      expect(aggregates[third_recipient.id][:click_count]).to eq(0)
    end
  end
end
