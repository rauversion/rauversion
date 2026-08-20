class AddDeletionAuditToProducts < ActiveRecord::Migration[8.1]
  def change
    add_reference :products, :deleted_by, foreign_key: { to_table: :users }
    add_column :products, :deletion_reason, :text
  end
end
