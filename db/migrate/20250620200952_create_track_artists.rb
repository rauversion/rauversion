class CreateTrackArtists < ActiveRecord::Migration[8.0]
  def change
    create_table :track_artists do |t|
      t.references :track, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
    add_index :track_artists, [:track_id, :user_id], unique: true
  end
end
