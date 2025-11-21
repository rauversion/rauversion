class CreateEventListContacts < ActiveRecord::Migration[8.0]
  def change
    create_table :event_list_contacts do |t|
      t.references :event_list, null: false, foreign_key: true
      t.string :email, null: false
      t.string :name
      t.string :first_name
      t.string :last_name
      t.string :dni
      t.string :country
      t.timestamps
    end

    add_index :event_list_contacts, [:event_list_id, :email], unique: true
    add_index :event_list_contacts, :email
  end
end
