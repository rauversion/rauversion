require "rails_helper"

RSpec.describe ServiceBookingLedgerEntry, type: :model do
  it "is append-only after creation" do
    entry = create(:service_booking_ledger_entry)

    expect {
      entry.update!(status: "changed")
    }.to raise_error(ActiveRecord::ReadOnlyRecord)

    expect {
      entry.destroy!
    }.to raise_error(ActiveRecord::ReadOnlyRecord)
  end

  it "does not duplicate entries with the same idempotency key" do
    booking = create(:service_booking)

    first = described_class.record!(
      service_booking: booking,
      entry_type: :checkout_created,
      milestone: :deposit,
      direction: :neutral,
      amount: 50,
      currency: "usd",
      idempotency_key: "stripe:test:cs_123",
      occurred_at: Time.current
    )

    second = described_class.record!(
      service_booking: booking,
      entry_type: :checkout_created,
      milestone: :deposit,
      direction: :neutral,
      amount: 50,
      currency: "usd",
      idempotency_key: "stripe:test:cs_123",
      occurred_at: Time.current
    )

    expect(second).to eq(first)
    expect(described_class.where(idempotency_key: "stripe:test:cs_123").count).to eq(1)
  end
end
