class AddStripeMilestoneFieldsToServiceBookings < ActiveRecord::Migration[7.0]
  def change
    change_table :service_bookings, bulk: true do |t|
      t.string :deposit_checkout_session_id
      t.string :deposit_payment_intent_id
      t.string :balance_checkout_session_id
      t.string :balance_payment_intent_id
    end

    add_index :service_bookings, :deposit_checkout_session_id
    add_index :service_bookings, :deposit_payment_intent_id
    add_index :service_bookings, :balance_checkout_session_id
    add_index :service_bookings, :balance_payment_intent_id
  end
end
