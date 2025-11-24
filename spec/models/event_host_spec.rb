require "rails_helper"

RSpec.describe EventHost, type: :model do
  describe "associations" do
    it { should belong_to(:event) }
    it { should belong_to(:user).optional }
  end

  describe "#invite_user" do
    let(:user) { FactoryBot.create(:user) }
    let(:event) { FactoryBot.create(:event, user: user) }
    let(:event_host) { FactoryBot.build(:event_host, event: event) }

    # before do
    #  allow(DeviseInvitable::Mailer).to receive_message_chain(:invitation_instructions, :deliver_later)
    # end

    before do
      allow_any_instance_of(DeviseInvitable::Mailer).to receive_message_chain(:invitation_instructions, :deliver_later)
    end

    it "sends an invitation email" do
      event_host.email = "foo@bar.com"
      expect_any_instance_of(DeviseInvitable::Mailer).to receive(:invitation_instructions) # .with(user, any_args)
      event_host.invite_user
      event_host.save
    end
  end
end
