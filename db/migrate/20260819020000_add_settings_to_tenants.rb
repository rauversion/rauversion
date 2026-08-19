class AddSettingsToTenants < ActiveRecord::Migration[7.1]
  def change
    add_column :tenants, :settings, :jsonb, default: {}, null: false
  end
end
