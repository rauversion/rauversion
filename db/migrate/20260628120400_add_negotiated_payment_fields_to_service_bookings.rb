class AddNegotiatedPaymentFieldsToServiceBookings < ActiveRecord::Migration[7.0]
  def change
    change_table :service_bookings, bulk: true do |t|
      t.jsonb :agreement_snapshot, null: false, default: {}
      t.string :contract_status, null: false, default: "not_generated"
      t.datetime :contract_signed_at
      t.decimal :platform_fee_rate, precision: 5, scale: 4, default: "0.05"
      t.decimal :platform_fee_amount, precision: 12, scale: 2
      t.decimal :artist_payout_amount, precision: 12, scale: 2
      t.string :deposit_status, null: false, default: "unpaid"
      t.string :balance_status, null: false, default: "unpaid"
      t.datetime :deposit_paid_at
      t.datetime :deposit_confirmed_at
      t.datetime :balance_paid_at
      t.datetime :balance_confirmed_at
      t.text :payment_tracking_notes
    end

    add_index :service_bookings, :contract_status
    add_index :service_bookings, :deposit_status
    add_index :service_bookings, :balance_status
  end
end
