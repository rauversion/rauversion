class CreateThemes < ActiveRecord::Migration[8.0]
  def change
    create_table :themes do |t|
      t.string :name, null: false
      t.boolean :system_theme, default: false, null: false
      t.integer :site_id
      t.jsonb :deploy_options, default: {}
      t.text :description

      t.timestamps
    end

    add_index :themes, :system_theme
    add_index :themes, :site_id
  end
end
