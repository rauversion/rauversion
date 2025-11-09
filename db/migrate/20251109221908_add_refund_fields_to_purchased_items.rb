class AddRefundFieldsToPurchasedItems < ActiveRecord::Migration[8.0]
  def change
    add_column :purchased_items, :refunded_at, :datetime
    add_column :purchased_items, :refund_id, :string
    add_index :purchased_items, :refund_id
  end
end
