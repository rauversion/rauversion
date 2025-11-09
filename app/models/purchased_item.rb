class PurchasedItem < ApplicationRecord
  belongs_to :purchase
  belongs_to :purchased_item, polymorphic: true

  include AASM

  aasm column: :state do
    state :pending, initial: true
    state :paid
    state :refunded

    event :confirm do
      transitions from: :pending, to: :paid
    end

    event :refund do
      transitions from: :paid, to: :refunded
    end
  end

  def qr
    url = Rails.application.routes.url_helpers.event_event_ticket_url(purchase.purchasable, signed_id)
    qrcode = RQRCode::QRCode.new(url)
    
    # Generate PNG data
    png = qrcode.as_png(
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
  
    # Convert to base64 for embedding in HTML
    base64_image = Base64.strict_encode64(png.to_s)
    "data:image/png;base64,#{base64_image}"
  end
  
  def toggle_check_in!
    if checked_in?
      update({checked_in: false, checked_in_at: nil})
    else
      update({checked_in: true, checked_in_at: Time.zone.now})
    end
  end
end
