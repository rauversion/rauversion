class CreateServiceBookingProposals < ActiveRecord::Migration[7.0]
  def change
    create_table :service_booking_proposals do |t|
      t.references :service_product, null: false, foreign_key: { to_table: :products }
      t.references :booker, null: false, foreign_key: { to_table: :users }
      t.references :artist, null: false, foreign_key: { to_table: :users }
      t.references :current_offer_by, foreign_key: { to_table: :users }
      t.references :accepted_by, foreign_key: { to_table: :users }
      t.references :service_booking, foreign_key: true
      t.string :status, null: false, default: "pending_artist_response"
      t.string :event_name, null: false
      t.date :event_date, null: false
      t.datetime :starts_at
      t.datetime :ends_at
      t.string :venue_name, null: false
      t.string :venue_address
      t.string :city, null: false
      t.string :country
      t.decimal :proposed_amount, precision: 12, scale: 2, null: false
      t.string :currency, null: false, default: "clp"
      t.decimal :deposit_percentage, precision: 5, scale: 2, null: false, default: "50.0"
      t.decimal :deposit_amount, precision: 12, scale: 2
      t.decimal :balance_amount, precision: 12, scale: 2
      t.string :fee_type, null: false, default: "landed"
      t.boolean :transport_included, null: false, default: false
      t.boolean :accommodation_included, null: false, default: false
      t.boolean :hospitality_included, null: false, default: false
      t.boolean :catering_included, null: false, default: false
      t.integer :guest_list_count, null: false, default: 0
      t.text :benefits
      t.text :technical_notes
      t.text :message
      t.integer :booker_counter_count, null: false, default: 0
      t.integer :artist_counter_count, null: false, default: 0
      t.jsonb :negotiation_history, null: false, default: []
      t.decimal :platform_fee_rate, precision: 5, scale: 4, null: false, default: "0.05"
      t.decimal :platform_fee_min_amount, precision: 12, scale: 2, null: false, default: "5000.0"
      t.decimal :platform_fee_amount, precision: 12, scale: 2
      t.decimal :artist_payout_amount, precision: 12, scale: 2
      t.datetime :accepted_at
      t.datetime :expires_at
      t.jsonb :contract_snapshot, null: false, default: {}

      t.timestamps
    end

    add_index :service_booking_proposals, [:service_product_id, :status], name: "idx_svc_booking_props_product_status"
    add_index :service_booking_proposals, [:artist_id, :event_date, :status], name: "idx_svc_booking_props_artist_date_status"
    add_index :service_booking_proposals, [:booker_id, :status], name: "idx_svc_booking_props_booker_status"
  end
end
