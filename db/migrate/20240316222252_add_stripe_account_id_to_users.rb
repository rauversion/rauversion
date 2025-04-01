class AddStripeAccountIdToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :stripe_account_id, :string
    add_index :users, :stripe_account_id
  end
end
