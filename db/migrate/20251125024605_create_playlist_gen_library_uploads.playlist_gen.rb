# This migration comes from playlist_gen (originally 20241125000004)
class CreatePlaylistGenLibraryUploads < ActiveRecord::Migration[8.0]
  def change
    create_table :playlist_gen_library_uploads do |t|
      t.string :status, null: false, default: "pending"
      t.string :source, null: false
      t.text :error_message
      t.integer :total_tracks_imported

      t.timestamps
    end

    add_index :playlist_gen_library_uploads, :status
    add_index :playlist_gen_library_uploads, :source
  end
end
