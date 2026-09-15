class PlanPrice < ApplicationRecord
  INTERVALS = %w[month year].freeze

  belongs_to :plan
  has_many :tenant_subscriptions, dependent: :restrict_with_exception

  validates :provider, :currency, :amount_cents, :billing_interval, presence: true
  validates :amount_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :billing_interval, inclusion: { in: INTERVALS }
  validates :provider_price_id, uniqueness: true, allow_blank: true

  scope :available, -> { where(active: true).order(:amount_cents, :id) }

  def checkout_available?
    active? && provider_price_id.present?
  end
end
