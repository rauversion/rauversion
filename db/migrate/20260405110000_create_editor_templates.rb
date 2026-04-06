class CreateEditorTemplates < ActiveRecord::Migration[7.0]
  def up
    create_table :editor_templates do |t|
      t.references :user, null: true, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.string :category, null: false
      t.string :thumbnail
      t.jsonb :page_data, null: false, default: {}

      t.timestamps
    end

    add_index :editor_templates, [:category, :user_id]
  end

  def down
    drop_table :editor_templates
  end
end
