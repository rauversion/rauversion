class CreateNewsletterContactLists < ActiveRecord::Migration[8.0]
  def change
    create_table :newsletter_contact_lists do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false

      t.timestamps
    end

    add_index :newsletter_contact_lists, [:user_id, :name], unique: true
  end
end
