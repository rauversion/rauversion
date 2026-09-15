require "rails_helper"

RSpec.describe ApplicationMailer, type: :mailer do
  around do |example|
    original_app_name = ENV["APP_NAME"]
    original_email_account = ENV["EMAIL_ACCOUNT"]

    ENV["APP_NAME"] = "Rauversion"
    ENV["EMAIL_ACCOUNT"] = "no-reply@example.com"
    example.run
  ensure
    ENV["APP_NAME"] = original_app_name
    ENV["EMAIL_ACCOUNT"] = original_email_account
  end

  describe "#default_from_address" do
    it "formats the sender with the app name and email account" do
      sender = Mail::Address.new(described_class.new.default_from_address)

      expect(sender.display_name).to eq("Rauversion")
      expect(sender.address).to eq("no-reply@example.com")
    end
  end
end
