class AddServiceDataToProducts < ActiveRecord::Migration[8.0]
  def change
    add_column :products, :data, :jsonb
  end
end
