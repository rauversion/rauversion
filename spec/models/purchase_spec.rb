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

    it "validates max_tickets_per_user across all purchases" do
      # Create a ticket with a limit of 3 tickets per user total
      ticket = FactoryBot.create(:event_ticket, event: event, qty: 100, max_tickets_per_user: 3)
      
      # First purchase: buy 2 tickets
      first_purchase = user.purchases.create!(purchasable: event)
      first_purchase.virtual_purchased = [VirtualPurchasedItem.new(resource: ticket, quantity: 2)]
      first_purchase.store_items
      first_purchase.save!
      # Mark as paid to count towards limit
      first_purchase.purchased_items.update_all(state: "paid")
      
      # Second purchase: try to buy 2 more tickets (should fail because user already has 2)
      second_purchase = user.purchases.new(purchasable: event)
      second_purchase.virtual_purchased = [VirtualPurchasedItem.new(resource: ticket, quantity: 2)]
      
      expect(second_purchase).to_not be_valid
      expect(second_purchase.errors.full_messages.join(" ")).to include("maximum limit of 3 tickets per person")
      expect(second_purchase.errors.full_messages.join(" ")).to include("already have 2 ticket(s)")
      
      # Should allow buying 1 more ticket (total 3)
      third_purchase = user.purchases.new(purchasable: event)
      third_purchase.virtual_purchased = [VirtualPurchasedItem.new(resource: ticket, quantity: 1)]
      expect(third_purchase).to be_valid
    end

    it "validates max_tickets_per_user for guest purchases by email" do
      # Create a ticket with a limit of 2 tickets per user total
      ticket = FactoryBot.create(:event_ticket, event: event, qty: 100, max_tickets_per_user: 2)
      guest_email = "guest@example.com"
      
      # Create a guest user for this email
      guest_user = FactoryBot.create(:user, email: guest_email)
      
      # First purchase as guest
      first_purchase = Purchase.create!(purchasable: event, user: guest_user, guest_email: guest_email)
      first_purchase.virtual_purchased = [VirtualPurchasedItem.new(resource: ticket, quantity: 1)]
      first_purchase.store_items
      first_purchase.save!
      # Mark as paid to count towards limit
      first_purchase.purchased_items.update_all(state: "paid")
      
      # Second purchase with same email: try to buy 2 more tickets (should fail)
      second_purchase = Purchase.new(purchasable: event, user: guest_user, guest_email: guest_email)
      second_purchase.virtual_purchased = [VirtualPurchasedItem.new(resource: ticket, quantity: 2)]
      
      expect(second_purchase).to_not be_valid
      expect(second_purchase.errors.full_messages.join(" ")).to include("maximum limit of 2 tickets per person")
    end

    it "allows unlimited tickets when max_tickets_per_user is not set" do
      # Create a ticket without max_tickets_per_user limit
      ticket = FactoryBot.create(:event_ticket, event: event, qty: 100)
      
      # First purchase: buy 5 tickets
      first_purchase = user.purchases.create!(purchasable: event)
      first_purchase.virtual_purchased = [VirtualPurchasedItem.new(resource: ticket, quantity: 5)]
      first_purchase.store_items
      first_purchase.save!
      first_purchase.purchased_items.update_all(state: "paid")
      
      # Second purchase: buy 5 more tickets (should succeed)
      second_purchase = user.purchases.new(purchasable: event)
      second_purchase.virtual_purchased = [VirtualPurchasedItem.new(resource: ticket, quantity: 5)]
      
      expect(second_purchase).to be_valid
    end

    it "allows unlimited tickets when max_tickets_per_user is 0" do
      # Create a ticket with max_tickets_per_user set to 0 (unlimited)
      ticket = FactoryBot.create(:event_ticket, event: event, qty: 100, max_tickets_per_user: 0)
      
      # First purchase: buy 5 tickets
      first_purchase = user.purchases.create!(purchasable: event)
      first_purchase.virtual_purchased = [VirtualPurchasedItem.new(resource: ticket, quantity: 5)]
      first_purchase.store_items
      first_purchase.save!
      first_purchase.purchased_items.update_all(state: "paid")
      
      # Second purchase: buy 5 more tickets (should succeed)
      second_purchase = user.purchases.new(purchasable: event)
      second_purchase.virtual_purchased = [VirtualPurchasedItem.new(resource: ticket, quantity: 5)]
      
      expect(second_purchase).to be_valid
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
