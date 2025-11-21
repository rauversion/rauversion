require "rails_helper"

RSpec.describe EventList, type: :model do
  it { should belong_to(:event) }
  it { should have_many(:event_list_contacts).dependent(:destroy) }
  it { should have_many(:event_tickets).dependent(:nullify) }

  it { should validate_presence_of(:name) }
  it { should validate_uniqueness_of(:name).scoped_to(:event_id) }

  describe "#contact_emails" do
    let(:user) { FactoryBot.create(:user) }
    let(:event) { FactoryBot.create(:event, user: user) }
    let(:event_list) { FactoryBot.create(:event_list, event: event) }

    it "returns an array of contact emails" do
      FactoryBot.create(:event_list_contact, event_list: event_list, email: "test1@example.com")
      FactoryBot.create(:event_list_contact, event_list: event_list, email: "test2@example.com")

      expect(event_list.contact_emails).to match_array(["test1@example.com", "test2@example.com"])
    end
  end

  describe "#has_email?" do
    let(:user) { FactoryBot.create(:user) }
    let(:event) { FactoryBot.create(:event, user: user) }
    let(:event_list) { FactoryBot.create(:event_list, event: event) }

    before do
      FactoryBot.create(:event_list_contact, event_list: event_list, email: "test@example.com")
    end

    it "returns true when email exists in the list" do
      expect(event_list.has_email?("test@example.com")).to be true
    end

    it "returns true when email exists with different case" do
      expect(event_list.has_email?("TEST@EXAMPLE.COM")).to be true
    end

    it "returns false when email does not exist" do
      expect(event_list.has_email?("other@example.com")).to be false
    end

    it "returns false when email is blank" do
      expect(event_list.has_email?("")).to be false
      expect(event_list.has_email?(nil)).to be false
    end
  end
end
