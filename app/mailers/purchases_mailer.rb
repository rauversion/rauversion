class PurchasesMailer < ApplicationMailer
  require "rqrcode"

  def event_ticket_confirmation(purchase:, inviter: nil, message: nil)
    @purchase = purchase
    @event = @purchase.purchasable
    @inviter = inviter
    @message = message

    @purchase.purchased_items.each do |purchased_item|
      # Skip QR code generation if disable_qr is enabled for this ticket
      next if purchased_item.purchased_item.disable_qr

      qr_code = generate_qr_code(purchased_item)
      filename = "ticket_#{purchased_item.id}_qr_code.png"

      # Adjuntamos el QR como imagen inline para poder usarlo vía CID en el HTML del email
      attachments.inline[filename] = {
        mime_type: "image/png",
        content: qr_code
      }
    end

    @url = tickets_purchases_url

    mail(to: @purchase.purchase_email, subject: "Purchase Confirmation")
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
    
    # Return binary PNG data directly
    # Rails ActionMailer will infer the content type from the filename
    png.to_s
  end
end
