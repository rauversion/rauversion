class AddSiteDataToEvents < ActiveRecord::Migration[7.1]
  def change
    add_column :events, :site_data, :jsonb, default: {}, null: false
  end
end
