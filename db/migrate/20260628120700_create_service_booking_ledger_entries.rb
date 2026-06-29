class CreateServiceBookingLedgerEntries < ActiveRecord::Migration[7.0]
  def change
    create_table :service_booking_ledger_entries do |t|
      t.references :service_booking, null: false, foreign_key: true, index: { name: "idx_svc_booking_ledger_booking" }
      t.references :actor, foreign_key: { to_table: :users }, index: { name: "idx_svc_booking_ledger_actor" }
      t.string :entry_type, null: false
      t.string :milestone
      t.string :direction, null: false, default: "neutral"
      t.decimal :amount, precision: 12, scale: 2
      t.string :currency, null: false, default: "usd"
      t.string :status
      t.string :gateway
      t.string :gateway_reference
      t.string :idempotency_key
      t.jsonb :metadata, null: false, default: {}
      t.datetime :occurred_at, null: false

      t.timestamps
    end

    add_index :service_booking_ledger_entries, [:service_booking_id, :occurred_at], name: "idx_svc_booking_ledger_booking_time"
    add_index :service_booking_ledger_entries, [:service_booking_id, :entry_type], name: "idx_svc_booking_ledger_booking_type"
    add_index :service_booking_ledger_entries, [:gateway, :gateway_reference], name: "idx_svc_booking_ledger_gateway_ref"
    add_index :service_booking_ledger_entries, :idempotency_key, unique: true, where: "idempotency_key IS NOT NULL", name: "idx_svc_booking_ledger_idem"
  end
end
