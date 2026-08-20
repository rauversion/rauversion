class Plan < ApplicationRecord
  has_many :plan_prices, dependent: :restrict_with_exception
  has_many :tenant_subscriptions, dependent: :restrict_with_exception

  validates :code, presence: true, uniqueness: true, format: { with: /\A[a-z0-9_]+\z/ }
  validates :name, presence: true

  scope :available, -> { where(active: true).order(:position, :id) }

  def entitlement(key)
    entitlements[key.to_s]
  end
end
