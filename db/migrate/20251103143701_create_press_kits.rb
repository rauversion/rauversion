class CreatePressKits < ActiveRecord::Migration[8.0]
  def change
    create_table :press_kits do |t|
      t.references :user, null: false, foreign_key: true
      t.text :bio
      t.text :press_release
      t.text :technical_rider
      t.text :stage_plot
      t.text :booking_info
      t.jsonb :settings, default: {}
      t.boolean :published, default: false
      
      t.timestamps
    end
    
    add_index :press_kits, :published
  end
end
