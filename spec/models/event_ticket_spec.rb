require "rails_helper"

RSpec.describe EventTicket, type: :model do
  it { should belong_to(:event) }
  it { should have_many(:purchased_items) }
  xit { should have_many(:purchased_tickets) }
  xit { should have_many(:paid_tickets) }

  describe "validations" do
    let(:user) { FactoryBot.create(:user) }
    let(:event) { FactoryBot.create(:event, user: user) }

    it "validates that selling_start is before selling_end" do
      ticket = FactoryBot.build(:event_ticket, event: event, selling_start: 1.day.from_now, selling_end: 1.day.ago)
      expect(ticket).not_to be_valid
      expect(ticket.errors[:selling_start]).to include("must be before selling end")
    end

    it "is valid when selling_start is before selling_end" do
      ticket = FactoryBot.build(:event_ticket, event: event, selling_start: 1.day.ago, selling_end: 1.day.from_now)
      expect(ticket).to be_valid
    end
  end

  describe "#free?" do
    let(:free_ticket) { FactoryBot.build(:event_ticket, price: 0) }
    let(:paid_ticket) { FactoryBot.build(:event_ticket, price: 50) }

    it "returns true if the price is zero" do
      expect(free_ticket.free?).to be true
    end

    it "returns false if the price is not zero" do
      expect(paid_ticket.free?).to be false
    end
  end

  describe "#pay_what_you_want?" do
    let(:user) { FactoryBot.create(:user) }
    let(:event) { FactoryBot.create(:event, user: user) }

    it "returns true when pay_what_you_want is enabled" do
      ticket = FactoryBot.build(:event_ticket, event: event)
      ticket.pay_what_you_want = true
      expect(ticket.pay_what_you_want?).to be true
    end

    it "returns false when pay_what_you_want is disabled" do
      ticket = FactoryBot.build(:event_ticket, event: event)
      ticket.pay_what_you_want = false
      expect(ticket.pay_what_you_want?).to be false
    end

    it "returns false when pay_what_you_want is nil" do
      ticket = FactoryBot.build(:event_ticket, event: event)
      expect(ticket.pay_what_you_want?).to be false
    end
  end

  describe "pay what you want validations" do
    let(:user) { FactoryBot.create(:user) }
    let(:event) { FactoryBot.create(:event, user: user) }

    it "requires minimum_price when pay_what_you_want is enabled" do
      ticket = FactoryBot.build(:event_ticket, event: event)
      ticket.pay_what_you_want = true
      ticket.minimum_price = nil
      expect(ticket).not_to be_valid
      expect(ticket.errors[:minimum_price]).to include("must be present and non-negative when pay what you want is enabled")
    end

    it "requires minimum_price to be non-negative when pay_what_you_want is enabled" do
      ticket = FactoryBot.build(:event_ticket, event: event)
      ticket.pay_what_you_want = true
      ticket.minimum_price = -5
      expect(ticket).not_to be_valid
      expect(ticket.errors[:minimum_price]).to include("must be present and non-negative when pay what you want is enabled")
    end

    it "is valid when pay_what_you_want is enabled with valid minimum_price" do
      ticket = FactoryBot.build(:event_ticket, event: event)
      ticket.pay_what_you_want = true
      ticket.minimum_price = 10
      expect(ticket).to be_valid
    end

    it "is valid when pay_what_you_want is disabled without minimum_price" do
      ticket = FactoryBot.build(:event_ticket, event: event)
      ticket.pay_what_you_want = false
      ticket.minimum_price = nil
      expect(ticket).to be_valid
    end

    it "allows minimum_price of zero when pay_what_you_want is enabled" do
      ticket = FactoryBot.build(:event_ticket, event: event)
      ticket.pay_what_you_want = true
      ticket.minimum_price = 0
      expect(ticket).to be_valid
    end
  end
end
