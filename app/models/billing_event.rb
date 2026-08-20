class BillingEvent < ApplicationRecord
  validates :provider, :provider_event_id, :event_type, presence: true
  validates :provider_event_id, uniqueness: { scope: :provider }

  def processed?
    processed_at.present?
  end
end
