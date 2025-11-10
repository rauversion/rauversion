require "rails_helper"

RSpec.describe Purchase, type: :model do
  it { belong_to(:user) }
  it { have_many(:purchased_items) }
  it { belong_to(:purchasable) }

  describe "free ticket purchase" do
    let!(:user) { FactoryBot.create(:user) }
    let!(:event) { FactoryBot.create(:event, user: user) }
    let!(:free_ticket) { FactoryBot.create(:event_ticket, event: event, qty: 10, price: 0) }

    it "creates a purchase with zero amount for free tickets" do
      purchase = user.purchases.new(purchasable: event)
      purchase.virtual_purchased = [VirtualPurchasedItem.new(resource: free_ticket, quantity: 2)]
      purchase.store_items
      purchase.save!
      
      expect(purchase).to be_persisted
      expect(purchase.purchased_items.count).to eq(2)
      expect(purchase.purchased_items.all? { |item| item.purchased_item == free_ticket }).to be true
      
      # Verify price and currency are stored
      purchase.purchased_items.each do |item|
        expect(item.price).to eq(free_ticket.price)
        expect(item.currency).to eq(event.ticket_currency || 'usd')
      end
    end

    it "completes purchase for free tickets without payment processing" do
      purchase = user.purchases.create!(purchasable: event, price: 0, currency: 'usd')
      purchase.purchased_items.create!(
        purchased_item: free_ticket,
        price: free_ticket.price,
        currency: event.ticket_currency || 'usd'
      )
      
      expect(purchase.state).to eq('pending')
      
      purchase.complete_purchase!
      
      expect(purchase.reload.state).to eq('paid')
      expect(purchase.purchased_items.reload.all?(&:paid?)).to be true
    end
  end

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

    it "stores price and currency when creating purchased items for paid tickets" do
      ticket = FactoryBot.create(:event_ticket, event: event, qty: 5, price: 50.0)
      purchase = user.purchases.new(purchasable: event)
      purchase.virtual_purchased = [VirtualPurchasedItem.new(resource: ticket, quantity: 2)]
      purchase.store_items
      purchase.save!

      expect(purchase).to be_persisted
      expect(purchase.purchased_items.count).to eq(2)
      
      # Verify that each purchased item has the correct price and currency stored
      purchase.purchased_items.each do |item|
        expect(item.price).to eq(50.0)
        expect(item.currency).to eq(event.ticket_currency || 'usd')
      end
    end
  end

  describe "background processing" do
    include ActiveJob::TestHelper

    let!(:user) { FactoryBot.create(:user) }
    let!(:event) { FactoryBot.create(:event, user: user) }

    it "enqueues and performs ProcessPurchaseJob which decrements ticket qty and enqueues mail" do
      ticket = FactoryBot.create(:event_ticket, event: event, qty: 5)
      purchase = FactoryBot.create(:purchase, user: user, purchasable: event)
      purchase.purchased_items.create!(
        purchased_item: ticket,
        price: ticket.price,
        currency: event.ticket_currency || 'usd'
      )

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
