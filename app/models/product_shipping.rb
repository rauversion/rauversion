class ProductShipping < ApplicationRecord
  belongs_to :product, optional: true

  validates :country, presence: true
  validates :base_cost, :additional_cost, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :country, uniqueness: { scope: :product_id }

  scope :default, -> { where(is_default: true) }
  scope :specific, -> { where(is_default: false) }
end
