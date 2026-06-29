class ServiceBookingLedgerEntry < ApplicationRecord
  belongs_to :service_booking
  belongs_to :actor, class_name: "User", optional: true

  enum :entry_type, {
    booking_created: "booking_created",
    checkout_created: "checkout_created",
    payment_reported: "payment_reported",
    payment_confirmed: "payment_confirmed",
    refund_processing: "refund_processing",
    refund_completed: "refund_completed",
    refund_failed: "refund_failed",
    payout_calculated: "payout_calculated"
  }

  enum :milestone, {
    booking: "booking",
    deposit: "deposit",
    balance: "balance",
    refund: "refund",
    payout: "payout"
  }, prefix: true

  enum :direction, {
    neutral: "neutral",
    incoming: "incoming",
    outgoing: "outgoing"
  }

  validates :entry_type, :direction, :currency, :occurred_at, presence: true
  validates :amount, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :idempotency_key, uniqueness: true, allow_blank: true

  before_validation :set_defaults
  before_update :prevent_mutation
  before_destroy :prevent_mutation

  def self.record!(attributes)
    idempotency_key = attributes[:idempotency_key].presence
    return create!(attributes) unless idempotency_key

    find_or_create_by!(idempotency_key: idempotency_key) do |entry|
      entry.assign_attributes(attributes.except(:idempotency_key))
    end
  end

  private

  def set_defaults
    self.currency = currency.to_s.downcase.presence || service_booking&.currency || "usd"
    self.direction ||= "neutral"
    self.occurred_at ||= Time.current
    self.metadata ||= {}
  end

  def prevent_mutation
    raise ActiveRecord::ReadOnlyRecord, "Service booking ledger entries are append-only"
  end
end
