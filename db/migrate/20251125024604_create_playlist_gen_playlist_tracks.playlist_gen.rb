# This migration comes from playlist_gen (originally 20241125000003)
class CreatePlaylistGenPlaylistTracks < ActiveRecord::Migration[8.0]
  def change
    create_table :playlist_gen_playlist_tracks do |t|
      t.references :playlist, null: false, foreign_key: { to_table: :playlist_gen_playlists }
      t.references :track, null: false, foreign_key: { to_table: :playlist_gen_tracks }
      t.integer :position, null: false

      t.timestamps
    end

    add_index :playlist_gen_playlist_tracks, [:playlist_id, :track_id], unique: true
    add_index :playlist_gen_playlist_tracks, [:playlist_id, :position]
  end
end
