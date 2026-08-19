class CreateTenantsAndMemberships < ActiveRecord::Migration[7.0]
  def up
    create_table :tenants do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.boolean :central, null: false, default: false

      t.timestamps
    end

    add_index :tenants, :slug, unique: true
    add_index :tenants, :central,
      unique: true,
      where: "central = TRUE",
      name: "index_tenants_on_single_central"

    create_table :memberships do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :role, null: false, default: "member"

      t.timestamps
    end

    add_index :memberships, [:tenant_id, :user_id], unique: true
    add_index :memberships, [:tenant_id, :role]

    central_tenant_id = select_value(<<~SQL.squish)
      INSERT INTO tenants (name, slug, central, created_at, updated_at)
      VALUES ('Rauversion', 'rauversion', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    SQL

    execute <<~SQL.squish
      INSERT INTO memberships (tenant_id, user_id, role, created_at, updated_at)
      SELECT
        #{connection.quote(central_tenant_id)},
        users.id,
        CASE
          WHEN users.role = 'admin' THEN 'admin'
          WHEN users.role = 'artist' THEN 'artist'
          WHEN users.editor = TRUE THEN 'editor'
          ELSE 'member'
        END,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM users
    SQL
  end

  def down
    drop_table :memberships
    drop_table :tenants
  end
end
