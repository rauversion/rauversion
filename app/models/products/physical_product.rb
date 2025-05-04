module Products
  class PhysicalProduct < Product
    validates :shipping_days, presence: true
    # validates :shipping_within_country_price, presence: true
    # validates :shipping_worldwide_price, presence: true
    
    validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
    validates :stock_quantity, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
    validates :sku, presence: true, uniqueness: true

    has_many :product_shippings, dependent: :destroy, foreign_key: 'product_id'
    accepts_nested_attributes_for :product_shippings, allow_destroy: true, reject_if: :all_blank

    validates :product_shippings, presence: true
    # after_create :create_default_shippings
  end
end
