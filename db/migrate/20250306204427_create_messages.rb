class CreateMessages < ActiveRecord::Migration[8.0]
  def change
    create_table :messages do |t|
      t.references :conversation, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.text :body, null: false
      t.string :message_type, null: false, default: 'text'
      t.boolean :read, null: false, default: false
      t.timestamps
    end

    add_index :messages, [:conversation_id, :created_at]
    add_index :messages, [:user_id, :created_at]
    add_index :messages, :message_type
    add_index :messages, :read
  end
end
