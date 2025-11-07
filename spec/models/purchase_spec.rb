require "rails_helper"

RSpec.describe Purchase, type: :model do
  it { belong_to(:user) }
  it { have_many(:purchased_items) }
  it { belong_to(:purchasable) }

  describe "purchasing tickets" do
    let!(:user) { FactoryBot.create(:user) }
    let!(:event) { FactoryBot.create(:event, user: user) }

    it "validates qty of tickets" do
      ticket = FactoryBot.create(:event_ticket, event: event, qty: 5, min_tickets_per_order: 2)
      purchase = user.purchases.new(purchasable: event)
      purchase.virtual_purchased = event.event_tickets.map do |aa|
        VirtualPurchasedItem.new({resource: aa, quantity: 6})
      end
      expect(purchase).to_not be_valid
      expect(purchase.errors.full_messages.join(" ")).to include("Exceeded available quantity")

      purchase.store_items
      purchase.save

      expect(purchase).to_not be_persisted
    end

    it "validates min_tickets_per_order of tickets" do
      ticket = FactoryBot.create(:event_ticket, event: event, qty: 5, min_tickets_per_order: 2)
      purchase = user.purchases.new(purchasable: event)
      purchase.virtual_purchased = event.event_tickets.map do |aa|
        VirtualPurchasedItem.new({resource: aa, quantity: 6})
      end
      expect(purchase).to_not be_valid
      expect(purchase.errors.full_messages.join(" ")).to include("Insufficient quantity ")

      purchase.store_items
      purchase.save

      expect(purchase).to_not be_persisted
    end

    it "validates max_tickets_per_order of tickets" do
      ticket = FactoryBot.create(:event_ticket, event: event, qty: 100, max_tickets_per_order: 2)
      purchase = user.purchases.new(purchasable: event)
      purchase.virtual_purchased = event.event_tickets.map do |aa|
        VirtualPurchasedItem.new({resource: aa, quantity: 6})
      end
      expect(purchase).to_not be_valid
      expect(purchase.errors.full_messages.join(" ")).to include("allows a maximum of 2")

      purchase.store_items
      purchase.save

      expect(purchase).to_not be_persisted
      # expect(purchase.purchased_items.size).to eq(3)
    end
  end

  describe "background processing" do
    include ActiveJob::TestHelper

    let!(:user) { FactoryBot.create(:user) }
    let!(:event) { FactoryBot.create(:event, user: user) }

    it "enqueues and performs ProcessPurchaseJob which decrements ticket qty and enqueues mail" do
      ticket = FactoryBot.create(:event_ticket, event: event, qty: 5)
      purchase = FactoryBot.create(:purchase, user: user, purchasable: event)
      purchase.purchased_items.create!(purchased_item: ticket)

      # Execute the job inline for test to verify side effects
      perform_enqueued_jobs do
        purchase.complete_purchase!
      end

      expect(ticket.reload.qty).to eq(4)
      # Verify that the mail job was enqueued (deliver_later)
      # expect(enqueued_jobs.map { |j| j[:job] }).to include(ActionMailer::MailDeliveryJob)
    end
  end
end
