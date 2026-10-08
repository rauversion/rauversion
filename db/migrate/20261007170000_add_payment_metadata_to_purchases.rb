class AddPaymentMetadataToPurchases < ActiveRecord::Migration[8.1]
  def change
    add_column :purchases, :payment_metadata, :jsonb, default: {}, null: false
  end
end
