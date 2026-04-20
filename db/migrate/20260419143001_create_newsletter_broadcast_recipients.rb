class CreateNewsletterBroadcastRecipients < ActiveRecord::Migration[8.0]
  def change
    create_table :newsletter_broadcast_recipients do |t|
      t.references :broadcast, null: false, foreign_key: { to_table: :newsletter_broadcasts }
      t.integer :position, null: false, default: 0
      t.string :email, null: false
      t.string :name
      t.string :first_name
      t.string :last_name
      t.string :country
      t.string :username
      t.string :display_name
      t.jsonb :event_titles, null: false, default: []
      t.jsonb :ticket_titles, null: false, default: []
      t.jsonb :source_labels, null: false, default: []
      t.jsonb :source_types, null: false, default: []
      t.string :status, null: false, default: "pending"
      t.text :error_message
      t.datetime :sent_at
      t.datetime :failed_at

      t.timestamps
    end

    add_index :newsletter_broadcast_recipients, [:broadcast_id, :email], unique: true
    add_index :newsletter_broadcast_recipients, [:broadcast_id, :position]
    add_index :newsletter_broadcast_recipients, :status
  end
end
