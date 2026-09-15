require "rails_helper"

RSpec.describe ServiceBooking, type: :model do
  include ActiveJob::TestHelper

  around do |example|
    previous_adapter = ActiveJob::Base.queue_adapter
    ActiveJob::Base.queue_adapter = :test
    clear_enqueued_jobs
    example.run
  ensure
    clear_enqueued_jobs
    ActiveJob::Base.queue_adapter = previous_adapter
  end

  describe "scheduled delivery validation" do
    it "allows flexible delivery bookings to be scheduled with an in-person location" do
      service_product = create(:service_product, delivery_method: "both")
      booking = build(
        :service_booking,
        service_product: service_product,
        status: "scheduled",
        scheduled_date: "2026-07-18",
        scheduled_time: "23:30",
        timezone: "UTC",
        meeting_location: "Club Rau, Santiago"
      )

      expect(booking).to be_valid
    end
  end

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

  describe "ledger entries" do
    it "records creation and initial paid snapshot entries" do
      booking = create(
        :service_booking,
        payment_status: "paid",
        total_amount: 120,
        currency: "usd",
        checkout_provider: "stripe",
        payment_session_id: "cs_initial",
        payment_intent_id: "pi_initial"
      )

      expect(booking.ledger_entries.pluck(:entry_type)).to include("booking_created", "payment_confirmed")

      payment_entry = booking.ledger_entries.find_by(entry_type: "payment_confirmed", milestone: "booking")
      expect(payment_entry.amount).to eq(120)
      expect(payment_entry.currency).to eq("usd")
      expect(payment_entry.gateway).to eq("stripe")
      expect(payment_entry.gateway_reference).to eq("cs_initial")
    end

    it "records deposit and balance milestone transitions" do
      booking = create(
        :service_booking,
        payment_status: "pending",
        total_amount: 100,
        deposit_amount: 40,
        balance_due_amount: 60,
        deposit_status: "unpaid",
        balance_status: "unpaid"
      )

      booking.mark_deposit_paid!(actor: booking.customer)
      booking.confirm_deposit!(actor: booking.provider)
      booking.mark_balance_paid!(actor: booking.customer)
      booking.confirm_balance!(actor: booking.provider)

      entries = booking.ledger_entries.where(entry_type: ["payment_reported", "payment_confirmed"]).order(:occurred_at, :id)

      expect(entries.map(&:milestone)).to include("deposit", "balance")
      expect(entries.find_by(entry_type: "payment_confirmed", milestone: "deposit").amount).to eq(40)
      expect(entries.find_by(entry_type: "payment_confirmed", milestone: "balance").amount).to eq(60)
      expect(booking.reload.payment_status).to eq("paid")
    end

    it "keeps stripe payment confirmations idempotent" do
      booking = create(
        :service_booking,
        payment_status: "pending",
        total_amount: 100,
        deposit_amount: 50,
        balance_due_amount: 50,
        deposit_status: "checkout_created"
      )
      checkout_session = OpenStruct.new(id: "cs_deposit", payment_intent: "pi_deposit", payment_status: "paid")

      booking.mark_deposit_paid_by_stripe!(checkout_session: checkout_session)
      booking.mark_deposit_paid_by_stripe!(checkout_session: checkout_session)

      expect(
        booking.ledger_entries.where(entry_type: "payment_confirmed", milestone: "deposit").count
      ).to eq(1)
    end

    it "records refund processing and completion" do
      booking = create(:service_booking, payment_status: "paid", total_amount: 100, currency: "usd")

      booking.mark_refund_processing!(actor: booking.provider)
      booking.mark_refunded!(refund_id: "re_123", actor: booking.provider)

      expect(booking.ledger_entries.find_by(entry_type: "refund_processing")).to be_present

      refund_entry = booking.ledger_entries.find_by(entry_type: "refund_completed")
      expect(refund_entry.amount).to eq(100)
      expect(refund_entry.direction).to eq("outgoing")
      expect(refund_entry.gateway_reference).to eq("re_123")
    end
  end

  describe "notifications" do
    it "notifies both parties when the booking is cancelled" do
      booking = create(:service_booking, status: "confirmed")
      clear_enqueued_jobs

      expect do
        booking.update!(
          status: "cancelled",
          cancelled_by: booking.provider,
          cancellation_reason: "El evento cambió de fecha"
        )
      end.to have_enqueued_mail(ServiceBookingMailer, :booking_cancelled_notification).exactly(2).times
    end

    it "lets the lifecycle sweep own upcoming reminder delivery" do
      service_product = create(:service_product, delivery_method: "in_person")
      booking = create(:service_booking, service_product: service_product, status: "confirmed")
      clear_enqueued_jobs

      expect do
        booking.update!(
          status: "scheduled",
          scheduled_date: 2.days.from_now.to_date.iso8601,
          scheduled_time: "22:00",
          timezone: "UTC",
          meeting_location: "Club Rau"
        )
      end.not_to have_enqueued_mail(ServiceBookingMailer, :reminder_notification)
    end
  end
end
