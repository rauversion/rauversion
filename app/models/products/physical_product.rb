module Products
  class PhysicalProduct < ::Product
    validates :shipping_days, presence: true
    validates :shipping_within_country_price, presence: true
    validates :shipping_worldwide_price, presence: true
    
    validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
    validates :stock_quantity, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
    validates :sku, presence: true, uniqueness: true
    
    after_create :create_default_shippings
  end
end
