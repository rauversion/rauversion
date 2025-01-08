module Products
  class MerchProduct < PhysicalProduct
    validates :category, inclusion: { in: ['merch'] }

    before_validation :set_category

    private

    def set_category
      self.category = 'merch'
    end
  end
end
