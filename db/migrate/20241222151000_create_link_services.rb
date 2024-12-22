class CreateLinkServices < ActiveRecord::Migration[7.0]
  def change
    create_table :link_services do |t|
      t.string :name
      t.string :icon
      t.string :url_pattern
      t.boolean :active, default: true
      t.integer :position

      t.timestamps
    end

    add_index :link_services, :position
    add_index :link_services, :active

    # Add service_type to user_links
    add_column :user_links, :service_type, :string
    add_index :user_links, :service_type
  end
end
