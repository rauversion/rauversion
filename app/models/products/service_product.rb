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
  end
end
