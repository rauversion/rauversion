class CreateVenues < ActiveRecord::Migration[8.0]
  def change
    create_table :venues do |t|
      t.string :name, null: false
      t.string :city
      t.string :country
      t.decimal :rating, precision: 3, scale: 2, null: false, default: 0.0
      t.integer :review_count, null: false, default: 0
      t.string :genres, array: true, default: []
      t.integer :capacity
      t.string :price_range
      t.text :description
      t.string :address
      t.decimal :lat, precision: 10, scale: 6
      t.decimal :lng, precision: 10, scale: 6
      t.string :slug
      t.text :image_url

      t.timestamps
    end

    add_index :venues, :slug, unique: true
    add_index :venues, :city
    add_index :venues, :country
    add_index :venues, :genres, using: :gin
  end
end
