require "rails_helper"

RSpec.describe InterestAlertMailer, type: :mailer do
  describe "notify_admin" do
    let(:mail) { InterestAlertMailer.notify_admin }

    it "renders the headers" do
      expect(mail.subject).to eq("Notify admin")
      expect(mail.to).to eq(["to@example.org"])
      expect(mail.from).to eq(["from@example.com"])
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("Hi")
    end
  end

end
