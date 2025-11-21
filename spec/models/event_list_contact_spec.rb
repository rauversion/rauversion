require "rails_helper"

RSpec.describe EventListContact, type: :model do
  it { should belong_to(:event_list) }

  it { should validate_presence_of(:email) }
  it { should validate_uniqueness_of(:email).scoped_to(:event_list_id) }

  describe "email format validation" do
    let(:user) { FactoryBot.create(:user) }
    let(:event) { FactoryBot.create(:event, user: user) }
    let(:event_list) { FactoryBot.create(:event_list, event: event) }

    it "accepts valid email addresses" do
      contact = FactoryBot.build(:event_list_contact, event_list: event_list, email: "valid@example.com")
      expect(contact).to be_valid
    end

    it "rejects invalid email addresses" do
      contact = FactoryBot.build(:event_list_contact, event_list: event_list, email: "invalid")
      expect(contact).not_to be_valid
    end
  end

  describe "email normalization" do
    let(:user) { FactoryBot.create(:user) }
    let(:event) { FactoryBot.create(:event, user: user) }
    let(:event_list) { FactoryBot.create(:event_list, event: event) }

    it "normalizes email to lowercase" do
      contact = FactoryBot.create(:event_list_contact, event_list: event_list, email: "TEST@EXAMPLE.COM")
      expect(contact.email).to eq("test@example.com")
    end

    it "strips whitespace from email" do
      contact = FactoryBot.create(:event_list_contact, event_list: event_list, email: "  test@example.com  ")
      expect(contact.email).to eq("test@example.com")
    end
  end
end
