module Products
  class AccessoryProduct < PhysicalProduct
    validates :category, inclusion: { in: ['accessories'] }

    before_validation :set_category

    private

    def set_category
      self.category = 'accessories'
    end
  end
end
