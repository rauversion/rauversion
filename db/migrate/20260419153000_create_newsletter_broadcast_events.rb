class CreateNewsletterBroadcastEvents < ActiveRecord::Migration[8.0]
  def change
    create_table :newsletter_broadcast_events do |t|
      t.references :broadcast, null: false, foreign_key: { to_table: :newsletter_broadcasts }
      t.references :recipient, null: false, foreign_key: { to_table: :newsletter_broadcast_recipients }
      t.string :event_type, null: false
      t.text :tracked_url
      t.string :ip_address
      t.text :user_agent
      t.datetime :occurred_at, null: false

      t.timestamps
    end

    add_index :newsletter_broadcast_events, [:broadcast_id, :event_type]
    add_index :newsletter_broadcast_events, [:broadcast_id, :recipient_id, :event_type], name: "idx_newsletter_broadcast_events_on_broadcast_recipient_type"
  end
end
