class CreateEventLists < ActiveRecord::Migration[8.0]
  def change
    create_table :event_lists do |t|
      t.string :name, null: false
      t.references :event, null: false, foreign_key: true
      t.timestamps
    end

    add_index :event_lists, [:event_id, :name], unique: true
  end
end
