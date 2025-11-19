class AddGuestEmailToPurchases < ActiveRecord::Migration[8.0]
  def change
    add_column :purchases, :guest_email, :string
    add_index :purchases, :guest_email
  end
end
