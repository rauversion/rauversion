class PurchasedItem < ApplicationRecord
  class CheckInError < StandardError; end

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
    set_checked_in!(!checked_in?)
  end

  def set_checked_in!(desired_checked_in)
    desired_checked_in = ActiveRecord::Type::Boolean.new.cast(desired_checked_in)
    return self if checked_in? == desired_checked_in

    if desired_checked_in
      raise CheckInError, "Refunded tickets cannot be checked in" if refunded?
      raise CheckInError, "Only paid tickets can be checked in" unless paid?

      update!(checked_in: true, checked_in_at: Time.zone.now)
    else
      update!(checked_in: false, checked_in_at: nil)
    end

    self
  end
end
