class Purchase < ApplicationRecord
  belongs_to :user
  has_many :purchased_items
  belongs_to :purchasable, polymorphic: true

  attr_writer :virtual_purchased

  validate :validate_purchased_items

  include AASM

  aasm column: :state do
    state :pending, initial: true
    state :paid

    event :confirm do
      transitions from: :pending, to: :paid
    end
  end

  def virtual_purchased
    @virtual_purchased || []
  end

  def virtual_purchased_attributes=(attributes)
    array = attributes.keys.map { |o| attributes[o] }
    @virtual_purchased = array.map { |o| o }
    # array.map{|o| ScheduleRecord.new(o) }
  end

  def validate_purchased_items
    return if @virtual_purchased.blank?

    @virtual_purchased.each do |purchased_item|
      resource = purchased_item.resource

      case resource.class.to_s
      when "EventTicket"
        validate_ticket(resource, purchased_item)
        # TODO: when "Track" # how to validate track? pricing
      end
    end
  end

  def validate_ticket(ticket, purchased_item)
    # Check if the ticket with the specified ID exists
    if ticket.blank?
      errors.add(:base, "Ticket with ID #{purchased_item.ticket_id} does not exist.")
    end

    # Check if the ticket quantity is sufficient for purchase
    if purchased_item.quantity >= ticket.qty
      errors.add(:base, "Insufficient quantity for Ticket ID #{ticket.id}. Available: #{ticket.qty}. Requested: #{purchased_item.quantity}.")
    end

    # Check if the total quantity purchased for this ticket in all previous purchases
    # does not exceed the ticket's available quantity
    total_purchased_quantity = purchasable.purchased_event_tickets.where(id: ticket.id).size
    if total_purchased_quantity + purchased_item.quantity > ticket.qty
      errors.add(:base, "Exceeded available quantity for Ticket ID #{ticket.id}. Already Purchased: #{total_purchased_quantity}. Requested: #{purchased_item.quantity}.")
    end

    # Check if the purchased quantity meets the :min_tickets_per_order setting
    if ticket.min_tickets_per_order.present? && purchased_item.quantity < ticket.min_tickets_per_order.to_i
      errors.add(:base, "Ticket ID #{ticket.id} requires a minimum of #{ticket.settings["min_tickets_per_order"]} tickets per order.")
    end

    # Check if the purchased quantity exceeds the :max_tickets_per_order setting
    if ticket.max_tickets_per_order.present? && purchased_item.quantity > ticket.max_tickets_per_order.to_i
      errors.add(:base, "Ticket ID #{ticket.id} allows a maximum of #{ticket.settings["max_tickets_per_order"]} tickets per order.")
    end
  end

  def store_items
    virtual_purchased.each do |a|
      a.quantity.times.each do
        item_attrs = { purchased_item: a.resource }
        
        # Store price and currency at purchase time for EventTickets
        if a.resource.is_a?(EventTicket)
          item_attrs[:price] = a.resource.price
          item_attrs[:currency] = a.resource.event.ticket_currency || 'usd'
        end
        
        purchased_items << PurchasedItem.new(item_attrs)
      end
    end
  end

  def complete_purchase!
    self.state = "paid"
    self.save
    purchased_items.update_all(state: "paid")
    # Enqueue background job to handle ticket decrements and post-purchase tasks.
    # This prevents blocking the request and allows DB row-locking inside the job.
    ProcessPurchaseJob.perform_later(self.id)
  end

  # todo: put this on a background job and queue with concurrency 1 per EventTicket
  def handle_event_ticket_purchase
    purchased_items.map do |item|
      next unless item.purchased_item_type == "EventTicket"

      ticket = EventTicket.find_by(id: item.purchased_item_id)
      next unless ticket

      ticket.qty -= 1
      ticket.update_column(:qty, ticket.qty)
    end
  end

  def notify_purchase
    PurchasesMailer.event_ticket_confirmation(purchase: self)
  end

  def is_downloadable?
    state == "paid" or state == "free_access"
  end

  def calculate_fee(total, ccy = "usd")
    t = total.to_f * app_fee() / 100.0
  
    case ccy
    when "usd"
      t
    when "clp"
      t.round
    else
      t
    end
  end

  def app_fee
    ENV['PLATFORM_EVENTS_FEE'].to_i
  end
end
