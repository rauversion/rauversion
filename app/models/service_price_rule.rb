class ServicePriceRule < ApplicationRecord
  belongs_to :service_product, class_name: "Products::ServiceProduct", inverse_of: :service_price_rules

  enum :rule_type, {
    base: "base",
    extra_hour: "extra_hour",
    travel: "travel",
    rider: "rider",
    deposit: "deposit",
    custom: "custom"
  }

  validates :name, presence: true
  validates :rule_type, presence: true
  validates :amount, numericality: { greater_than_or_equal_to: 0 }
  validates :currency, presence: true

  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(:position, :created_at) }
end
