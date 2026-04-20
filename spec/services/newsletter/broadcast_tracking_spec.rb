require "rails_helper"

RSpec.describe Newsletter::BroadcastTracking do
  describe ".prepare_html" do
    let(:user) { create(:user, confirmed_at: Time.current, can_send_newsletter: true) }
    let(:broadcast) do
      Newsletter::Broadcast.create!(
        user: user,
        name: "Abril",
        status: "completed",
        total_recipients: 1,
        sent_recipients: 1
      )
    end
    let(:recipient) do
      Newsletter::BroadcastRecipient.create!(
        broadcast: broadcast,
        position: 0,
        email: "ana@example.com",
        first_name: "Ana",
        status: "sent"
      )
    end
    let(:html) do
      <<~HTML
        <html>
          <body>
            <a href="https://example.com/promo">Promo</a>
            <a href="/catalogo">Catalogo</a>
            <a href="mailto:hola@example.com">Mail</a>
          </body>
        </html>
      HTML
    end

    it "rewrites trackable links and appends an open pixel" do
      document = Nokogiri::HTML(described_class.prepare_html(recipient: recipient, html: html))
      hrefs = document.css("a[href]").map { |link| link["href"] }
      pixel = document.css("img").find { |image| image["src"].to_s.include?("/newsletter/track/open") }

      expect(hrefs[0]).to include("/newsletter/track/click?token=")
      expect(hrefs[1]).to include("/newsletter/track/click?token=")
      expect(hrefs[2]).to eq("mailto:hola@example.com")
      expect(pixel).to be_present
      expect(pixel["width"]).to eq("1")
      expect(pixel["height"]).to eq("1")
    end
  end
end
