class AddDisplayNameToUsers < ActiveRecord::Migration[8.0]
  def up
    add_column :users, :display_name, :string

    execute <<~SQL.squish
      UPDATE users
      SET display_name = username
      WHERE username IS NOT NULL
        AND (display_name IS NULL OR display_name = '')
    SQL
  end

  def down
    remove_column :users, :display_name
  end
end
