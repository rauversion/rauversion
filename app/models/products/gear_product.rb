module Products
  class GearProduct < PhysicalProduct
    validates :category, inclusion: { in: ['instrument', 'audio_gear', 'dj_gear'] }
    validates :condition, presence: true
    validates :brand, presence: true
    validates :model, presence: true
    validates :year, presence: true
    validates :barter_description, presence: true, if: :accept_barter?

    scope :used_gear, -> { where(category: ['instrument', 'audio_gear', 'dj_gear']) }
  end
end
