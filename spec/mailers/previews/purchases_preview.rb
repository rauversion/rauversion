# Preview all emails at http://localhost:3000/rails/mailers/purchases
class PurchasesPreview < ActionMailer::Preview
  def event_ticket_confirmation
    purchase = Purchase.includes(:purchased_items, :purchasable, :user).last
    PurchasesMailer.event_ticket_confirmation(purchase: purchase)
  end
end
