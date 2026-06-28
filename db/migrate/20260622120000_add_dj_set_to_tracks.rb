class AddDjSetToTracks < ActiveRecord::Migration[8.1]
  def change
    add_column :tracks, :dj_set, :boolean, default: false, null: false
    add_index :tracks, :dj_set
  end
end
