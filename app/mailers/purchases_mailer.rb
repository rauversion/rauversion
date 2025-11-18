class PurchasesMailer < ApplicationMailer
  require "rqrcode"

  def event_ticket_confirmation(purchase:, inviter: nil, message: nil)
    @purchase = purchase
    @event = @purchase.purchasable
    @inviter = inviter
    @message = message

    @purchase.purchased_items.each do |purchased_item|
      qr_code = generate_qr_code(purchased_item)
      attachments["ticket_#{purchased_item.id}_qr_code.png"] = qr_code
    end
    
    @url = tickets_purchases_url 


    mail(to: @purchase.user.email, subject: "Purchase Confirmation")
  end

  private

  def generate_qr_code(purchased_item)
    url = event_event_ticket_url(purchased_item.purchase.purchasable, purchased_item.signed_id)
    qr = RQRCode::QRCode.new(url)
    png = qr.as_png(
      bit_depth: 1,
      border_modules: 4,
      color_mode: ChunkyPNG::COLOR_GRAYSCALE,
      color: 'black',
      file: nil,
      fill: 'white',
      module_px_size: 6,
      resize_exactly_to: false,
      resize_gte_to: false,
      size: 250
    )
    
    # Return as hash with explicit content type for proper attachment handling
    {
      mime_type: 'image/png',
      content: png.to_s
    }
  end
end
