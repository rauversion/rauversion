module Products
  class AccessoryProduct < PhysicalProduct
    validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
    validates :stock_quantity, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
    validates :sku, presence: true, uniqueness: true
    
    before_validation :set_category

    enum :category, { 
      merch: 'merch', 
      other: 'other',
      accessories: 'accessories',
      cables: "cables",
      cases: "cases",
      stands: "stands"
    }

    private

    def set_category
      self.category = 'accessories'
    end
  end
end
