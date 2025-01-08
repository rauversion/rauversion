module Products
  class MerchProduct < PhysicalProduct
    validates :category, inclusion: { in: ['merch'] }

    validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
    validates :stock_quantity, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
    validates :sku, presence: true, uniqueness: true
    
    before_validation :set_category

    private

    def set_category
      self.category = 'merch'
    end
  end
end
