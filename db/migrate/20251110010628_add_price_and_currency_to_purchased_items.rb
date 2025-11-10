class AddPriceAndCurrencyToPurchasedItems < ActiveRecord::Migration[8.0]
  def change
    add_column :purchased_items, :price, :decimal
    add_column :purchased_items, :currency, :string
  end
end
