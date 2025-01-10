class CreateServiceBookings < ActiveRecord::Migration[7.0]
  def change
    create_table :service_bookings do |t|
      t.references :service_product, null: false, foreign_key: { to_table: :products }
      t.references :customer, null: false, foreign_key: { to_table: :users }
      t.references :provider, null: false, foreign_key: { to_table: :users }
      t.string :status, null: false
      t.jsonb :metadata, null: false, default: {}
      
      t.timestamps
    end

    add_index :service_bookings, :status
  end
end
