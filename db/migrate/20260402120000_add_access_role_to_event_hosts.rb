class AddAccessRoleToEventHosts < ActiveRecord::Migration[8.0]
  def up
    add_column :event_hosts, :access_role, :string
    add_index :event_hosts, :access_role

    execute <<~SQL.squish
      UPDATE event_hosts
      SET access_role = CASE
        WHEN event_manager IS TRUE THEN 'admin'
        ELSE 'host'
      END
      WHERE access_role IS NULL
    SQL

    change_column_null :event_hosts, :access_role, false
  end

  def down
    remove_index :event_hosts, :access_role
    remove_column :event_hosts, :access_role
  end
end
