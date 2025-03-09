class CreateParticipants < ActiveRecord::Migration[8.0]
  def change
    create_table :participants do |t|
      t.references :conversation, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :role, null: false, default: 'member'
      t.timestamps
    end

    add_index :participants, [:conversation_id, :user_id], unique: true
    add_index :participants, [:user_id, :conversation_id]
    add_index :participants, :role
  end
end
