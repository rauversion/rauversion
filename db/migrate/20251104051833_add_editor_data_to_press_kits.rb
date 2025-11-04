class AddEditorDataToPressKits < ActiveRecord::Migration[8.0]
  def change
    add_column :press_kits, :editor_data, :jsonb, default: {}
    add_column :press_kits, :use_builder, :boolean, default: false
    
    add_index :press_kits, :editor_data, using: :gin
  end
end
