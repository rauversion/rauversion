class AddPromptToPlaylistGenPlaylists < ActiveRecord::Migration[8.0]
  def change
    add_column :playlist_gen_playlists, :prompt, :text
  end
end
