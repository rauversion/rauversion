class CreateVenueRatingStats < ActiveRecord::Migration[8.0]
  def change
    create_table :venue_rating_stats do |t|
      t.references :venue, null: false, foreign_key: true
      t.date :bucket_on, null: false
      t.string :reviewer_role, null: false
      t.string :metric, null: false
      t.decimal :sum, precision: 10, scale: 2, null: false, default: 0
      t.integer :count, null: false, default: 0
      t.datetime :last_review_at

      t.timestamps
    end

    add_index :venue_rating_stats, [:venue_id, :bucket_on, :reviewer_role, :metric], unique: true, name: "idx_venue_rating_stats_unique_bucket"
    add_index :venue_rating_stats, [:venue_id, :metric, :bucket_on], name: "idx_venue_rating_stats_lookup"
  end
end
