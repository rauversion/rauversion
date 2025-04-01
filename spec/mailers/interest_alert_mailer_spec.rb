require "rails_helper"

RSpec.describe InterestAlertMailer, type: :mailer do
  describe "notify_admin" do
    let(:admin_user) { FactoryBot.create(:admin_user) }
    let(:user) { FactoryBot.create(:user) }
    let(:interest_alert) { FactoryBot.create(:interest_alert, user: user, body: "helloo!!", role: :artist) }

    let(:mail) { InterestAlertMailer.notify_admin(interest_alert, admin_user) }

    it "renders the headers" do
      expect(mail.subject).to include("New Role Request from")
      expect(mail.to).to eq([admin_user.email])
      # expect(mail.from).to eq(["from@example.com"])
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("New Role Request")
      # Add more expectations to check the email body content
      # Example:
      # expect(mail.body.encoded).to match(interest_alert.title)
      # expect(mail.body.encoded).to match(interest_alert.description)
    end
  end

end
