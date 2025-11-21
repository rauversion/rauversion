class AddEventListToEventTickets < ActiveRecord::Migration[8.0]
  def change
    add_reference :event_tickets, :event_list, null: true, foreign_key: { on_delete: :nullify }
    add_index :event_tickets, :event_list_id
  end
end
