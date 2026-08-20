class AddPaymentSnapshotToServiceBookings < ActiveRecord::Migration[8.1]
  def change
    change_table :service_bookings, bulk: true do |t|
      t.references :product_purchase, foreign_key: true
      t.references :product_purchase_item, foreign_key: true
      t.string :currency, null: false, default: "usd"
      t.decimal :subtotal_amount, precision: 10, scale: 2
      t.decimal :total_amount, precision: 10, scale: 2
      t.decimal :deposit_amount, precision: 10, scale: 2
      t.decimal :balance_due_amount, precision: 10, scale: 2
      t.string :payment_status, null: false, default: "unpaid"
      t.string :checkout_provider
      t.string :payment_intent_id
      t.string :payment_session_id
      t.string :refund_status, null: false, default: "not_requested"
      t.string :refund_id
      t.datetime :refunded_at
      t.datetime :starts_at
      t.datetime :ends_at
      t.string :venue_name
      t.string :venue_address
      t.string :city
      t.string :country
    end

    add_index :service_bookings, :payment_status
    add_index :service_bookings, :refund_status
    add_index :service_bookings, :payment_intent_id
  end
end
