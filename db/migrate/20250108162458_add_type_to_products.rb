class AddTypeToProducts < ActiveRecord::Migration[8.0]
  def change
    add_column :products, :type, :string
  end
end
