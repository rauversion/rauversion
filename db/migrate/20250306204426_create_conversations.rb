class CreateConversations < ActiveRecord::Migration[8.0]
  def change
    create_table :conversations do |t|
      t.string :subject, null: false
      t.string :status, null: false, default: 'active'
      t.references :messageable, polymorphic: true, null: false
      t.timestamps
    end

    add_index :conversations, [:messageable_type, :messageable_id]
    add_index :conversations, :status
  end
end
