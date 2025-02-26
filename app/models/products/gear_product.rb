module Products
  class GearProduct < PhysicalProduct
    validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
    validates :stock_quantity, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
    validates :sku, presence: true, uniqueness: true
    validates :condition, presence: true
    validates :category, inclusion: { in: ['instrument', 'audio_gear', 'dj_gear'] }
    validates :brand, presence: true
    validates :model, presence: true
    validates :year, presence: true
    validates :barter_description, presence: true, if: :accept_barter?

    scope :used_gear, -> { where(category: ['instrument', 'audio_gear', 'dj_gear']) }
  
  
    enum :category, { 
      instrument: 'instrument', 
      audio_gear: 'audio_gear', 
      dj_gear: 'dj_gear',
      synth: 'synth',
      drum_kit: 'drum_kit',
      keyboard: 'keyboard',
      percussion: 'percussion',
      bass: 'bass',
      guitar: 'guitar',
      effect: 'effect',
      amp: 'amp',
      console: 'console',
      controller: 'controller'
    }


  end
end
