class CreateNewsletterBroadcasts < ActiveRecord::Migration[8.0]
  def change
    create_table :newsletter_broadcasts do |t|
      t.references :user, null: false, foreign_key: true
      t.references :audience, foreign_key: { to_table: :newsletter_audiences }
      t.references :email_template, foreign_key: true
      t.string :name, null: false
      t.string :status, null: false, default: "draft"
      t.text :subject_template
      t.text :html_template
      t.integer :total_recipients, null: false, default: 0
      t.integer :sent_recipients, null: false, default: 0
      t.integer :failed_recipients, null: false, default: 0
      t.text :last_error
      t.datetime :started_at
      t.datetime :completed_at
      t.datetime :failed_at

      t.timestamps
    end

    add_index :newsletter_broadcasts, :status
    add_index :newsletter_broadcasts, [:user_id, :updated_at]
  end
end
