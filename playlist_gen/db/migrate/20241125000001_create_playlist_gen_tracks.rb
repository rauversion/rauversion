class CreatePlaylistGenTracks < ActiveRecord::Migration[8.0]
  def change
    create_table :playlist_gen_tracks do |t|
      t.string :title, null: false
      t.string :artist
      t.decimal :bpm, precision: 5, scale: 2
      t.string :key
      t.string :genre
      t.integer :energy
      t.integer :duration_seconds
      t.string :file_path
      t.string :source
      t.string :external_id

      t.timestamps
    end

    add_index :playlist_gen_tracks, :bpm
    add_index :playlist_gen_tracks, :genre
    add_index :playlist_gen_tracks, :energy
    add_index :playlist_gen_tracks, [:external_id, :source], unique: true
  end
end
