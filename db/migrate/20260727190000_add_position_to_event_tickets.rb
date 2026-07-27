class AddPositionToEventTickets < ActiveRecord::Migration[8.1]
  def up
    add_column :event_tickets, :position, :integer

    execute <<~SQL
      UPDATE event_tickets
      SET position = ordered_tickets.position
      FROM (
        SELECT
          id,
          (ROW_NUMBER() OVER (
            PARTITION BY event_id
            ORDER BY created_at ASC, id ASC
          ))::integer AS position
        FROM event_tickets
      ) AS ordered_tickets
      WHERE event_tickets.id = ordered_tickets.id
    SQL

    change_column_null :event_tickets, :position, false
    add_index :event_tickets, [:event_id, :position]
  end

  def down
    remove_index :event_tickets, [:event_id, :position]
    remove_column :event_tickets, :position
  end
end
