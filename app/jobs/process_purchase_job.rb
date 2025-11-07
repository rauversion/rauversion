class ProcessPurchaseJob < ApplicationJob
  queue_as :default

  # Perform post-purchase work that must run in the background and should be
  # serialized per ticket via DB row locking.
  #
  # - Decrements EventTicket.qty for each purchased EventTicket (1 per purchased item row)
  # - Enqueues the purchase confirmation email (deliver_later)
  #
  # The job is idempotent-ish: it locks ticket rows before decrementing so concurrent
  # workers won't race when using DB row locking (SELECT ... FOR UPDATE).
  def perform(purchase_id)
    purchase = Purchase.find_by(id: purchase_id)
    return unless purchase

    # Only process if the purchase is in a paid/free_access state
    return unless purchase.state == "paid" || purchase.state == "free_access"

    purchase.purchased_items.find_each do |item|
      next unless item.purchased_item_type == "EventTicket"

      # Lock the ticket row to avoid concurrent decrements
      EventTicket.transaction do
        ticket = EventTicket.lock.find_by(id: item.purchased_item_id)
        unless ticket
          Rails.logger.warn("ProcessPurchaseJob: ticket not found (id=#{item.purchased_item_id}) for purchase #{purchase.id}")
          next
        end

        # Ensure qty is an integer
        current_qty = ticket.qty.to_i

        if current_qty > 0
          # Use update_column to avoid callbacks/validations — mirrors previous behavior
          ticket.update_column(:qty, current_qty - 1)
        else
          Rails.logger.warn("ProcessPurchaseJob: ticket #{ticket.id} has no qty left for purchase #{purchase.id}")
        end
      end
    end

    # Enqueue confirmation email asynchronously
    begin
      PurchasesMailer.event_ticket_confirmation(purchase: purchase).deliver_later
    rescue => e
      Rails.logger.error("ProcessPurchaseJob: failed to enqueue mail for purchase #{purchase.id}: #{e.message}")
    end
  end
end
