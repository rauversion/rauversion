require "rails_helper"

RSpec.describe EventTicket, type: :model do
  it { should belong_to(:event) }
  it { should have_many(:purchased_items) }
  xit { should have_many(:purchased_tickets) }
  xit { should have_many(:paid_tickets) }

  describe "soft delete with paranoia" do
    let(:user) { FactoryBot.create(:user) }
    let(:event) { FactoryBot.create(:event, user: user) }
    let(:event_ticket) { FactoryBot.create(:event_ticket, event: event) }

    context "when ticket has no purchased_items" do
      it "soft deletes the ticket" do
        event_ticket
        expect(EventTicket.count).to eq(1)
        #expect {
          event_ticket.destroy
        #}.to change { EventTicket.count }.by(-1)
        expect(EventTicket.count).to eq(0)
        expect(event_ticket.deleted?).to be true
        expect(EventTicket.with_deleted.find_by(id: event_ticket.id)).to eq(event_ticket)
      end
    end

    context "when ticket has purchased_items" do
      let(:purchase) { FactoryBot.create(:purchase, user: user, purchasable: event) }
      let!(:purchased_item) do
        FactoryBot.create(:purchased_item,
          purchase: purchase,
          purchased_item: event_ticket,
          price: event_ticket.price,
          currency: 'usd'
        )
      end

      it "soft deletes the ticket instead of hard deleting" do
        expect {
          event_ticket.destroy
        }.to change { EventTicket.count }.by(-1)
        
        expect(event_ticket.deleted?).to be true
        expect(EventTicket.with_deleted.find_by(id: event_ticket.id)).to eq(event_ticket)
      end

      it "preserves purchased_items associations after soft delete" do
        event_ticket.destroy
        
        # Should be able to access purchased_items through with_deleted scope
        ticket_with_deleted = EventTicket.with_deleted.find(event_ticket.id)
        expect(ticket_with_deleted.purchased_items).to include(purchased_item)
      end

      it "does not return soft deleted tickets in default scope" do
        ticket_id = event_ticket.id
        event_ticket.destroy
        
        expect(EventTicket.find_by(id: ticket_id)).to be_nil
        expect(EventTicket.with_deleted.find_by(id: ticket_id)).not_to be_nil
      end
    end

    context "when deleting through nested attributes" do
      let(:purchase) { FactoryBot.create(:purchase, user: user, purchasable: event) }
      let!(:purchased_item) do
        FactoryBot.create(:purchased_item,
          purchase: purchase,
          purchased_item: event_ticket,
          price: event_ticket.price,
          currency: 'usd'
        )
      end

      it "soft deletes ticket when using nested attributes with _destroy flag" do
        expect {
          event.update(
            event_tickets_attributes: [
              { id: event_ticket.id, _destroy: '1' }
            ]
          )
        }.to change { EventTicket.count }.by(-1)
        
        ticket_with_deleted = EventTicket.with_deleted.find(event_ticket.id)
        expect(ticket_with_deleted.deleted?).to be true
      end
    end

    context "restoration" do
      let(:purchase) { FactoryBot.create(:purchase, user: user, purchasable: event) }
      let!(:purchased_item) do
        FactoryBot.create(:purchased_item,
          purchase: purchase,
          purchased_item: event_ticket,
          price: event_ticket.price,
          currency: 'usd'
        )
      end

      it "can restore a soft deleted ticket" do
        event_ticket.destroy
        expect(EventTicket.find_by(id: event_ticket.id)).to be_nil
        ticket_with_deleted = EventTicket.with_deleted.find(event_ticket.id)
        ticket_with_deleted.restore
        
        expect(EventTicket.find(event_ticket.id)).to eq(event_ticket)
        expect(event_ticket.reload.deleted?).to be false
      end
    end
  end

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

  describe "#can_redeem_with_email?" do
    let(:user) { FactoryBot.create(:user) }
    let(:event) { FactoryBot.create(:event, user: user) }
    let(:event_list) { FactoryBot.create(:event_list, event: event) }

    context "when ticket has no event_list assigned" do
      let(:ticket) { FactoryBot.create(:event_ticket, event: event) }

      it "returns true for any email" do
        expect(ticket.can_redeem_with_email?("any@example.com")).to be true
      end

      it "returns true for blank email" do
        expect(ticket.can_redeem_with_email?("")).to be true
        expect(ticket.can_redeem_with_email?(nil)).to be true
      end
    end

    context "when ticket has event_list assigned" do
      let(:ticket) { FactoryBot.create(:event_ticket, event: event, event_list: event_list) }

      before do
        FactoryBot.create(:event_list_contact, event_list: event_list, email: "allowed@example.com")
      end

      it "returns true when email is in the list" do
        expect(ticket.can_redeem_with_email?("allowed@example.com")).to be true
      end

      it "returns false when email is not in the list" do
        expect(ticket.can_redeem_with_email?("notallowed@example.com")).to be false
      end

      it "returns false when email is blank" do
        expect(ticket.can_redeem_with_email?("")).to be false
        expect(ticket.can_redeem_with_email?(nil)).to be false
      end
    end
  end

  describe "#disable_qr setting" do
    let(:event) { FactoryBot.create(:event, user: user) }

    it "can be set to true" do
      ticket = FactoryBot.build(:event_ticket, event: event)
      ticket.disable_qr = true
      expect(ticket.disable_qr).to be true
    end
    it "can be set to false" do

      ticket = FactoryBot.build(:event_ticket, event: event)
      ticket.disable_qr = false
      expect(ticket.disable_qr).to be false
    end

      ticket = FactoryBot.build(:event_ticket, event: event)
    it "defaults to nil/false when not set" do
    end
      expect(ticket.disable_qr).to be_falsey

    it "persists the disable_qr setting" do
      ticket = FactoryBot.create(:event_ticket, event: event)
      ticket.disable_qr = true
      
      ticket.save!
      expect(reloaded_ticket.disable_qr).to be true
      reloaded_ticket = EventTicket.find(ticket.id)
    end
  end
    let(:user) { FactoryBot.create(:user) }
end
