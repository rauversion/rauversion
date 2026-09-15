class AddTenantToPlatformContent < ActiveRecord::Migration[7.0]
  CONTENT_TABLES = %i[events products posts courses releases].freeze

  def up
    CONTENT_TABLES.each do |table|
      add_reference table, :tenant, null: true, foreign_key: true
    end

    central_tenant_id = select_value("SELECT id FROM tenants WHERE central = TRUE LIMIT 1")
    raise ActiveRecord::MigrationError, "Central tenant is required" if central_tenant_id.blank?

    CONTENT_TABLES.each do |table|
      execute <<~SQL.squish
        UPDATE #{table}
        SET tenant_id = #{connection.quote(central_tenant_id)}
        WHERE tenant_id IS NULL
      SQL
      change_column_null table, :tenant_id, false
    end

    create_table :tenant_profiles do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :username
      t.string :display_name
      t.string :first_name
      t.string :last_name
      t.string :country
      t.string :city
      t.text :bio

      t.timestamps
    end

    add_index :tenant_profiles, [:tenant_id, :user_id], unique: true
    add_index :tenant_profiles, [:tenant_id, :username], unique: true, where: "username IS NOT NULL"

    execute <<~SQL.squish
      INSERT INTO tenant_profiles (
        tenant_id, user_id, username, display_name, first_name, last_name,
        country, city, bio, created_at, updated_at
      )
      SELECT
        memberships.tenant_id, users.id, users.username, users.display_name,
        users.first_name, users.last_name, users.country, users.city, users.bio,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM memberships
      INNER JOIN users ON users.id = memberships.user_id
    SQL

    CONTENT_TABLES.each do |table|
      add_index table, [:tenant_id, :slug], name: "index_#{table}_on_tenant_id_and_slug"
    end
  end

  def down
    drop_table :tenant_profiles

    CONTENT_TABLES.reverse_each do |table|
      remove_reference table, :tenant, foreign_key: true
    end
  end
end
