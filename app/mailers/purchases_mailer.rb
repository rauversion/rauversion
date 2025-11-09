class PurchasesMailer < ApplicationMailer
  require "rqrcode"

  def event_ticket_confirmation(purchase: )
    @purchase = purchase
    @event = @purchase.purchasable

    # @purchase.purchased_items.each do |purchased_item|
    #  qr_code = generate_qr_code(purchased_item)
    #  attachments["purchase_item_#{purchased_item.id}_qr_code.png"] = qr_code
    # end
    # 
    @url = tickets_purchases_url 


    mail(to: @purchase.user.email, subject: "Purchase Confirmation")
  end

  private

  def generate_qr_code(purchased_item)
    url = event_event_ticket_url(purchased_item.purchase.purchasable, purchased_item.encoded_id)
    qr = RQRCode::QRCode.new(url)
    png = qr.as_png(size: 120)
    StringIO.new(png.to_s)
  end
end
