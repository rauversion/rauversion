class AddCurrencyToPurchases < ActiveRecord::Migration[8.0]
  def change
    add_column :purchases, :currency, :string, default: "usd", null: false
    add_column :product_purchases, :currency, :string, default: "usd", null: false
    add_column :product_purchase_items, :currency, :string, default: "usd", null: false

  end
end
