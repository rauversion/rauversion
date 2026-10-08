class AddLocalPickupToProducts < ActiveRecord::Migration[8.1]
  def change
    add_column :products, :allow_pickup, :boolean, default: false, null: false
    add_column :product_purchases, :delivery_method, :string, default: "shipping", null: false
  end
end
