class AddCurrencyToProducts < ActiveRecord::Migration[7.0]
  def change
    add_column :products, :currency, :string, null: false, default: "usd"
    add_index :products, :currency
  end
end
