module ServiceBookings
  class LifecycleSweepJob < ApplicationJob
    queue_as :default

    PROVIDER_CONFIRMATION_DELAY = ENV.fetch("SERVICE_BOOKING_PROVIDER_CONFIRMATION_REMINDER_AFTER_HOURS", 6).to_i.hours
    DEPOSIT_REMINDER_DELAY = ENV.fetch("SERVICE_BOOKING_DEPOSIT_REMINDER_AFTER_HOURS", 2).to_i.hours
    BALANCE_REMINDER_WINDOW = ENV.fetch("SERVICE_BOOKING_BALANCE_REMINDER_BEFORE_HOURS", 72).to_i.hours
    UPCOMING_REMINDER_WINDOW = ENV.fetch("SERVICE_BOOKING_UPCOMING_REMINDER_BEFORE_HOURS", 24).to_i.hours

    def perform(now: Time.current)
      remind_pending_provider_confirmations(now)
      remind_pending_deposits(now)
      remind_pending_balances(now)
      remind_upcoming_bookings(now)
    end

    private

    def remind_pending_provider_confirmations(now)
      ServiceBooking
        .pending_confirmation
        .where(provider_confirmation_reminder_sent_at: nil)
        .where("created_at <= ?", now - PROVIDER_CONFIRMATION_DELAY)
        .includes(:service_product, :customer, :provider)
        .find_each do |booking|
          mark_and_notify!(booking, :provider_confirmation_reminder_sent_at, now) do
            ServiceBookingMailer.provider_confirmation_reminder(booking).deliver_later
          end
        end
    end

    def remind_pending_deposits(now)
      payable_bookings
        .where(deposit_payment_reminder_sent_at: nil)
        .where(deposit_status: %w[unpaid checkout_created])
        .where("deposit_amount > 0")
        .where("created_at <= ?", now - DEPOSIT_REMINDER_DELAY)
        .includes(:service_product, :customer, :provider)
        .find_each do |booking|
          mark_and_notify!(booking, :deposit_payment_reminder_sent_at, now) do
            ServiceBookingMailer.deposit_payment_reminder(booking).deliver_later
          end
        end
    end

    def remind_pending_balances(now)
      payable_bookings
        .where(balance_payment_reminder_sent_at: nil)
        .where(deposit_status: "confirmed")
        .where(balance_status: %w[unpaid checkout_created])
        .where("balance_due_amount > 0")
        .includes(:service_product, :customer, :provider)
        .find_each do |booking|
          scheduled_at = booking.scheduled_start_at
          next unless scheduled_at.blank? || scheduled_at.between?(now, now + BALANCE_REMINDER_WINDOW)

          mark_and_notify!(booking, :balance_payment_reminder_sent_at, now) do
            ServiceBookingMailer.balance_payment_reminder(booking).deliver_later
          end
        end
    end

    def remind_upcoming_bookings(now)
      ServiceBooking
        .scheduled
        .where(upcoming_reminder_sent_at: nil)
        .includes(:service_product, :customer, :provider)
        .find_each do |booking|
          scheduled_at = booking.scheduled_start_at
          next unless scheduled_at&.between?(now, now + UPCOMING_REMINDER_WINDOW)

          mark_and_notify!(booking, :upcoming_reminder_sent_at, now) do
            ServiceBookingMailer.reminder_notification(booking, booking.customer).deliver_later
            ServiceBookingMailer.reminder_notification(booking, booking.provider).deliver_later
          end
        end
    end

    def payable_bookings
      ServiceBooking.where.not(status: %w[cancelled refunded completed])
    end

    def mark_and_notify!(booking, column, now)
      booking.with_lock do
        booking.reload
        return if booking.public_send(column).present?

        yield
        booking.update_column(column, now)
      end
    end
  end
end
