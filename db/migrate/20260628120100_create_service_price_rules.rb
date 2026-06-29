class CreateServicePriceRules < ActiveRecord::Migration[8.1]
  def change
    create_table :service_price_rules do |t|
      t.references :service_product, null: false, foreign_key: { to_table: :products }
      t.string :name, null: false
      t.string :rule_type, null: false, default: "base"
      t.decimal :amount, precision: 10, scale: 2, null: false, default: 0
      t.string :currency, null: false, default: "usd"
      t.integer :duration_minutes
      t.string :location_scope
      t.integer :min_notice_days
      t.jsonb :conditions, null: false, default: {}
      t.boolean :active, null: false, default: true
      t.integer :position, null: false, default: 0

      t.timestamps
    end

    add_index :service_price_rules, [:service_product_id, :active]
    add_index :service_price_rules, :rule_type
  end
end
