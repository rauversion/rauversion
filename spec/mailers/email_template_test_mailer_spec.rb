require "rails_helper"

RSpec.describe EmailTemplateTestMailer, type: :mailer do
  describe "#test_email" do
    it "builds a multipart test email with the compiled html" do
      mail = described_class.with(
        to_email: "demo@example.com",
        subject: "Newsletter semanal",
        html: "<html><body><h1>Hola</h1><p>Contenido</p></body></html>"
      ).test_email

      expect(mail.to).to eq(["demo@example.com"])
      expect(mail.subject).to eq("[TEST] Newsletter semanal")
      expect(mail.html_part.body.to_s).to include("Hola")
      expect(mail.text_part.body.to_s).to include("Hola")
    end
  end
end
