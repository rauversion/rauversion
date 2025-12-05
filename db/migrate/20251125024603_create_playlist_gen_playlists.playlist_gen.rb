# This migration comes from playlist_gen (originally 20241125000002)
class CreatePlaylistGenPlaylists < ActiveRecord::Migration[8.0]
  def change
    create_table :playlist_gen_playlists do |t|
      t.string :name, null: false
      t.integer :duration_seconds
      t.decimal :bpm_min, precision: 5, scale: 2
      t.decimal :bpm_max, precision: 5, scale: 2
      t.string :energy_curve
      t.integer :total_tracks
      t.string :status, null: false, default: "draft"
      t.datetime :generated_at

      t.timestamps
    end

    add_index :playlist_gen_playlists, :status
    add_index :playlist_gen_playlists, :generated_at
  end
end
