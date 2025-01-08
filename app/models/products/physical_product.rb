module Products
  class PhysicalProduct < ::Product
    validates :shipping_days, presence: true
    validates :shipping_within_country_price, presence: true
    validates :shipping_worldwide_price, presence: true
    
    after_create :create_default_shippings
  end
end
