# Preview all emails at http://localhost:3000/rails/mailers/purchases_mailer
class PurchasesMailerPreview < ActionMailer::Preview
  # Preview for the event ticket confirmation email
  # Accessible at:
  #   http://localhost:3000/rails/mailers/purchases_mailer/event_ticket_confirmation
  def event_ticket_confirmation
    # Try to find a purchase for an Event with purchased_items
    purchase = Purchase
      .includes(:user, :purchased_items)
      .where(purchasable_type: "Event")
      .where.not(user_id: nil)
      .where.not(id: nil)
      .first

    # Fallback: use any purchase if there is no Event purchase yet
    purchase ||= Purchase.includes(:user, :purchased_items).first

    # If there is no purchase in the database, raise a helpful error so it's
    # obvious why the preview fails when opened in the browser.
    raise "No Purchase records found. Please create a Purchase (preferably for an Event) to use this preview." unless purchase

    PurchasesMailer.event_ticket_confirmation(
      purchase: purchase,
      inviter: nil,
      message: "Thanks for your purchase! Here are your tickets."
    )
  end
end
