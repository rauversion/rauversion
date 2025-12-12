class AddEmbeddingToPlaylistGenTracks < ActiveRecord::Migration[8.0]
  def change
    add_column :playlist_gen_tracks, :embedding, :vector, limit: 1536
    add_index :playlist_gen_tracks, :embedding, using: :ivfflat, opclass: :vector_cosine_ops
  end
end
