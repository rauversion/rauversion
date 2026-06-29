require "rails_helper"

RSpec.describe ServiceBooking, type: :model do
  describe "#refund_amount_for_gateway" do
    it "returns cents for decimal currencies" do
      booking = build(:service_booking, total_amount: 49.99, currency: "usd")

      expect(booking.refund_amount_for_gateway).to eq(4_999)
    end

    it "returns whole units for zero-decimal currencies" do
      booking = build(:service_booking, total_amount: 25_000, currency: "clp")

      expect(booking.refund_amount_for_gateway).to eq(25_000)
    end
  end
end
