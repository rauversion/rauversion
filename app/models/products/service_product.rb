module Products
  class ServiceProduct < Product
    enum :category, {
      coaching: 'coaching',
      feedback: 'feedback',
      classes: 'classes'
    }

    store_accessor :data, 
      :delivery_method,
      :duration_minutes,
      :max_participants,
      :prerequisites,
      :what_to_expect,
      :cancellation_policy

    # Define the enum after declaring the attribute
    #enum :delivery_method, {
    #  online: 'online',
    #  in_person: 'in_person',
    #  both: 'both'
    #}, prefix: true



    validates :category, presence: true
    validates :delivery_method, presence: true
    validates :duration_minutes, presence: true, numericality: { greater_than: 0 }
    validates :max_participants, presence: true, numericality: { greater_than: 0 }, if: :classes?
    validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
    validates :stock_quantity, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
    validates :sku, presence: true, uniqueness: true

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

    def decrease_quantity(amount, customer = nil)
      return unless amount.positive?
      
      with_lock do
        new_quantity = stock_quantity - amount
        if new_quantity >= 0
          update!(stock_quantity: new_quantity)
          update!(status: :sold_out) if new_quantity == 0
          
          # Create service booking for each purchased slot
          if customer.present?
            amount.times do
              ServiceBooking.create!(
                service_product: self,
                customer: customer,
                provider: user,
                status: :pending_confirmation
              )
            end
          end
        else
          raise ActiveRecord::RecordInvalid.new(self)
        end
      end
    end
  end
end