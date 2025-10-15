class CreateVenueReviews < ActiveRecord::Migration[8.0]
  def change
    create_table :venue_reviews do |t|
      t.references :venue, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :reviewer_role, null: false
      t.decimal :overall_rating, precision: 2, scale: 1, null: false
      t.jsonb :aspects, null: false, default: {}
      t.text :comment

      t.timestamps
    end

    add_index :venue_reviews, :reviewer_role
    add_index :venue_reviews, :aspects, using: :gin
  end
end
