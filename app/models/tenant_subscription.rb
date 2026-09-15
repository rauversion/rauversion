class TenantSubscription < ApplicationRecord
  ACCESS_STATUSES = %w[trialing active].freeze
  STATUSES = %w[pending incomplete incomplete_expired trialing active past_due canceled unpaid paused].freeze

  belongs_to :tenant
  belongs_to :subscriber, class_name: "User"
  belongs_to :plan
  belongs_to :plan_price

  validates :tenant_id, uniqueness: true
  validates :status, inclusion: { in: STATUSES }
  validate :price_belongs_to_plan

  before_validation :snapshot_entitlements, if: :should_snapshot_entitlements?

  def allows_access?(at: Time.current)
    return true if status.in?(ACCESS_STATUSES)

    status == "past_due" && grace_period_ends_at.present? && grace_period_ends_at > at
  end

  def entitlement(key)
    entitlements_snapshot[key.to_s]
  end

  private

  def should_snapshot_entitlements?
    plan.present? && (will_save_change_to_plan_id? || entitlements_snapshot.blank?)
  end

  def snapshot_entitlements
    self.entitlements_snapshot = plan.entitlements.deep_dup
  end

  def price_belongs_to_plan
    return if plan_price.blank? || plan.blank? || plan_price.plan_id == plan.id

    errors.add(:plan_price, "must belong to the selected plan")
  end
end
