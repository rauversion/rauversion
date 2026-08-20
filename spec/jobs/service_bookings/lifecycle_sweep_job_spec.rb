require "rails_helper"

RSpec.describe ServiceBookings::LifecycleSweepJob, type: :job do
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

  let(:now) { Time.zone.local(2026, 7, 18, 12, 0, 0) }
  let(:service_product) { create(:service_product, delivery_method: "in_person") }

  it "reminds providers about stale pending confirmations" do
    booking = create(:service_booking, status: "pending_confirmation")
    booking.update_column(:created_at, now - 7.hours)
    clear_enqueued_jobs

    expect do
      described_class.perform_now(now: now)
    end.to have_enqueued_mail(ServiceBookingMailer, :provider_confirmation_reminder).once

    expect(booking.reload.provider_confirmation_reminder_sent_at).to be_present
  end

  it "reminds customers about unpaid deposits" do
    booking = create(
      :service_booking,
      status: "confirmed",
      payment_status: "pending",
      deposit_status: "unpaid",
      deposit_amount: 50_000
    )
    booking.update_column(:created_at, now - 3.hours)
    clear_enqueued_jobs

    expect do
      described_class.perform_now(now: now)
    end.to have_enqueued_mail(ServiceBookingMailer, :deposit_payment_reminder).once

    expect(booking.reload.deposit_payment_reminder_sent_at).to be_present
  end

  it "reminds customers about balances before an upcoming booking" do
    booking = create(
      :service_booking,
      service_product: service_product,
      status: "scheduled",
      payment_status: "pending",
      deposit_status: "confirmed",
      balance_status: "unpaid",
      balance_due_amount: 75_000,
      scheduled_date: (now + 2.days).to_date.iso8601,
      scheduled_time: "22:00",
      timezone: "UTC",
      meeting_location: "Club Rau"
    )
    clear_enqueued_jobs

    expect do
      described_class.perform_now(now: now)
    end.to have_enqueued_mail(ServiceBookingMailer, :balance_payment_reminder).once

    expect(booking.reload.balance_payment_reminder_sent_at).to be_present
  end

  it "reminds both parties about bookings happening soon" do
    booking = create(
      :service_booking,
      service_product: service_product,
      status: "scheduled",
      scheduled_date: now.to_date.iso8601,
      scheduled_time: "22:00",
      timezone: "UTC",
      meeting_location: "Club Rau"
    )
    clear_enqueued_jobs

    expect do
      described_class.perform_now(now: now)
    end.to have_enqueued_mail(ServiceBookingMailer, :reminder_notification).exactly(2).times

    expect(booking.reload.upcoming_reminder_sent_at).to be_present
  end

  it "does not duplicate reminders once a timestamp is set" do
    booking = create(
      :service_booking,
      status: "confirmed",
      payment_status: "pending",
      deposit_status: "unpaid",
      deposit_amount: 50_000,
      deposit_payment_reminder_sent_at: now - 1.hour
    )
    booking.update_column(:created_at, now - 3.hours)
    clear_enqueued_jobs

    expect do
      described_class.perform_now(now: now)
    end.not_to have_enqueued_mail(ServiceBookingMailer, :deposit_payment_reminder)
  end
end
