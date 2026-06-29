module Products
  class ServiceProduct < Product
    SERVICE_KINDS = {
      advisory: 'advisory',
      education: 'education',
      performance: 'performance',
      studio_service: 'studio_service'
    }.freeze

    BOOKING_MODES = {
      instant_checkout: 'instant_checkout',
      request_quote: 'request_quote',
      deposit_then_balance: 'deposit_then_balance'
    }.freeze

    enum :service_kind, SERVICE_KINDS
    enum :booking_mode, BOOKING_MODES

    enum :category, {
      coaching: 'coaching',
      feedback: 'feedback',
      classes: 'classes',
      one_on_one_class: 'one_on_one_class',
      workshop: 'workshop',
      dj_set: 'dj_set',
      live_act: 'live_act',
      hybrid_live: 'hybrid_live',
      vocalist: 'vocalist',
      host_mc: 'host_mc',
      event_consulting: 'event_consulting',
      other: 'other',
      mastering: 'mastering',
      mixing: 'mixing',
      production: 'production',
      recording: 'recording',
      songwriting: 'songwriting',
      sound_design: 'sound_design',
      voice_over: 'voice_over'
    }

    store_accessor :data, 
      :delivery_method,
      :duration_minutes,
      :max_participants,
      :prerequisites,
      :what_to_expect,
      :cancellation_policy,
      :post_purchase_instructions,
      :performance_format,
      :home_city,
      :home_country,
      :available_countries,
      :technical_rider,
      :hospitality_rider,
      :price_notes

    # Define the enum after declaring the attribute
    #enum :delivery_method, {
    #  online: 'online',
    #  in_person: 'in_person',
    #  both: 'both'
    #}, prefix: true


    has_many :service_bookings, class_name: 'ServiceBooking', foreign_key: :service_product_id, dependent: :destroy
    has_many :service_booking_proposals, foreign_key: :service_product_id, dependent: :destroy
    has_many :service_price_rules, foreign_key: :service_product_id, dependent: :destroy, inverse_of: :service_product

    accepts_nested_attributes_for :service_price_rules, allow_destroy: true

    validates :service_kind, presence: true
    validates :booking_mode, presence: true
    validates :category, presence: true
    validates :delivery_method, presence: true
    validates :duration_minutes, presence: true, numericality: { greater_than: 0 }
    validates :max_participants, presence: true, numericality: { greater_than: 0 }, if: :classes?
    validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
    # validates :stock_quantity, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
    # validates :sku, presence: true, uniqueness: true

    def self.delivery_methods
      {
        online: 'online',
        in_person: 'in_person',
        both: 'both'
      }
    end

    def classes?
      category == 'classes'
    end

    # Type casting for numeric fields
    def duration_minutes=(value)
      super(value.presence && value.to_i)
    end

    def max_participants=(value)
      super(value.presence && value.to_i)
    end

    def set_service_booking_for(item, purchase)
      subtotal_amount = item.price.to_d * item.quantity.to_i
      total_amount = item.total_price_with_shipping

      service_booking = ServiceBooking.create!(
        service_product: self,
        customer: purchase.user,
        provider: user,
        product_purchase: purchase,
        product_purchase_item: item,
        status: :pending_confirmation,
        currency: item.currency.presence || purchase.currency.presence || "usd",
        subtotal_amount: subtotal_amount,
        total_amount: total_amount,
        payment_status: purchase.completed? ? :paid : :pending,
        checkout_provider: purchase.payment_provider,
        payment_intent_id: purchase.payment_intent_id,
        payment_session_id: purchase.payment_session_id
      )

      service_booking.set_service_product_conversation
      service_booking
    end

    def decrease_quantity(amount)
      
      return false

      # with_lock do
      #   new_quantity = stock_quantity - amount
      #   if new_quantity >= 0
      #     update!(stock_quantity: new_quantity)
      #     update!(status: :sold_out) if new_quantity == 0
      #     
      #     # Create service booking for each purchased slot
      #     if customer.present?
      #       amount.times do
      #         ServiceBooking.create!(
      #           service_product: self,
      #           customer: customer,
      #           provider: user,
      #           status: :pending_confirmation
      #         )
      #       end
      #     end
      #   else
      #     raise ActiveRecord::RecordInvalid.new(self)
      #   end
      # end
    end
  end
end
