class CreatePressKits < ActiveRecord::Migration[8.0]
  def change
    create_table :press_kits do |t|
      t.references :user, null: false, foreign_key: true
      t.jsonb :data, default: {}, null: false
      
      t.timestamps
    end
    
    add_index :press_kits, :data, using: :gin
  end
end
