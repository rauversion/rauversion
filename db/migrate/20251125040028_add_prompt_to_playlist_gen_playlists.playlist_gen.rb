# This migration comes from playlist_gen (originally 20241125000005)
class AddPromptToPlaylistGenPlaylists < ActiveRecord::Migration[8.0]
  def change
    add_column :playlist_gen_playlists, :prompt, :text
  end
end
