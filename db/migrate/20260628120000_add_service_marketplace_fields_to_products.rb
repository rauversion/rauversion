class AddServiceMarketplaceFieldsToProducts < ActiveRecord::Migration[8.1]
  def change
    add_column :products, :service_kind, :string, null: false, default: "advisory"
    add_column :products, :booking_mode, :string, null: false, default: "instant_checkout"

    add_index :products, [:type, :service_kind]
    add_index :products, [:type, :booking_mode]
  end
end
