class AddTenantToMusicCatalog < ActiveRecord::Migration[7.0]
  def up
    add_reference :tracks, :tenant, null: true, foreign_key: true
    add_reference :playlists, :tenant, null: true, foreign_key: true

    central_tenant_id = select_value("SELECT id FROM tenants WHERE central = TRUE LIMIT 1")
    raise ActiveRecord::MigrationError, "Central tenant is required" if central_tenant_id.blank?

    execute <<~SQL.squish
      UPDATE tracks
      SET tenant_id = #{connection.quote(central_tenant_id)}
      WHERE tenant_id IS NULL
    SQL

    execute <<~SQL.squish
      UPDATE playlists
      SET tenant_id = #{connection.quote(central_tenant_id)}
      WHERE tenant_id IS NULL
    SQL

    change_column_null :tracks, :tenant_id, false
    change_column_null :playlists, :tenant_id, false

    add_index :tracks, [:tenant_id, :slug], name: "index_tracks_on_tenant_id_and_slug"
    add_index :playlists, [:tenant_id, :slug], name: "index_playlists_on_tenant_id_and_slug"
  end

  def down
    remove_reference :playlists, :tenant, foreign_key: true
    remove_reference :tracks, :tenant, foreign_key: true
  end
end
