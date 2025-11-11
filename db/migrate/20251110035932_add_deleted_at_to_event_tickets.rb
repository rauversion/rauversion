class AddDeletedAtToEventTickets < ActiveRecord::Migration[8.0]
  def change
    add_column :event_tickets, :deleted_at, :datetime
    add_index :event_tickets, :deleted_at
  end
end
