class AddSocialLinksSettingsToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :social_links_settings, :jsonb, default: {}, null: false
    add_index :users, :social_links_settings, using: :gin
  end
end
