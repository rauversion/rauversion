class CreateReleasePlaylists < ActiveRecord::Migration[7.0]
  def change
    create_table :release_playlists do |t|
      t.references :release, null: false, foreign_key: true
      t.references :playlist, null: false, foreign_key: true
      t.integer :position
      t.timestamps
    end

    # Add an index for the position to optimize ordering
    add_index :release_playlists, :position
    
    # Add a unique index to prevent duplicate associations
    add_index :release_playlists, [:release_id, :playlist_id], unique: true
  end
end
