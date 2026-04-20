class CreateNewsletterContacts < ActiveRecord::Migration[8.0]
  def change
    create_table :newsletter_contacts do |t|
      t.references :contact_list, null: false, foreign_key: { to_table: :newsletter_contact_lists }
      t.string :email, null: false
      t.string :name
      t.string :first_name
      t.string :last_name
      t.string :country
      t.string :dni

      t.timestamps
    end

    add_index :newsletter_contacts, :email
    add_index :newsletter_contacts, [:contact_list_id, :email], unique: true
  end
end
