class AddLifecycleReminderFieldsToServiceBookings < ActiveRecord::Migration[8.1]
  def change
    change_table :service_bookings, bulk: true do |t|
      t.datetime :provider_confirmation_reminder_sent_at
      t.datetime :deposit_payment_reminder_sent_at
      t.datetime :balance_payment_reminder_sent_at
      t.datetime :upcoming_reminder_sent_at
    end

    add_index :service_bookings, :provider_confirmation_reminder_sent_at
    add_index :service_bookings, :deposit_payment_reminder_sent_at
    add_index :service_bookings, :balance_payment_reminder_sent_at
    add_index :service_bookings, :upcoming_reminder_sent_at
  end
end
