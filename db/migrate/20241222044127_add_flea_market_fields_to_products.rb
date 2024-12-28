class AddFleaMarketFieldsToProducts < ActiveRecord::Migration[7.0]
  def change
    add_column :products, :condition, :string
    add_column :products, :brand, :string
    add_column :products, :model, :string
    add_column :products, :year, :integer
    add_column :products, :accept_barter, :boolean, default: false
    add_column :products, :barter_description, :text

    add_index :products, :condition
    add_index :products, :brand
    add_index :products, :model
    add_index :products, :year
    add_index :products, :accept_barter
  end
end
