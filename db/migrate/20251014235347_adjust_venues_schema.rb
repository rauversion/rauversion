class AdjustVenuesSchema < ActiveRecord::Migration[8.0]
  def up
    # Ensure name is required
    change_column_null :venues, :name, false

    # Rating with precision/scale and default
    change_column :venues, :rating, :decimal, precision: 3, scale: 2, default: 0.0, null: false

    # Review count default and not null
    change_column_default :venues, :review_count, from: nil, to: 0
    change_column_null :venues, :review_count, false, 0

    # Convert genres from string to string[] with default []
    execute <<~SQL
      ALTER TABLE venues
      ALTER COLUMN genres TYPE varchar[] USING
        CASE
          WHEN genres IS NULL OR genres = '' THEN ARRAY[]::varchar[]
          ELSE ARRAY[genres]::varchar[]
        END,
      ALTER COLUMN genres SET DEFAULT ARRAY[]::varchar[];
    SQL

    # Precision for lat/lng
    change_column :venues, :lat, :decimal, precision: 10, scale: 6
    change_column :venues, :lng, :decimal, precision: 10, scale: 6

    # Indexes
    add_index :venues, :slug, unique: true, if_not_exists: true
    add_index :venues, :city, if_not_exists: true
    add_index :venues, :country, if_not_exists: true
    add_index :venues, :genres, using: :gin, if_not_exists: true
  end

  def down
    # Remove indexes
    remove_index :venues, column: :genres, if_exists: true
    remove_index :venues, column: :country, if_exists: true
    remove_index :venues, column: :city, if_exists: true
    remove_index :venues, column: :slug, if_exists: true

    # Revert lat/lng
    change_column :venues, :lat, :decimal
    change_column :venues, :lng, :decimal

    # Revert genres back to string
    execute <<~SQL
      ALTER TABLE venues
      ALTER COLUMN genres TYPE varchar USING
        CASE
          WHEN genres IS NULL THEN NULL
          WHEN array_length(genres, 1) = 0 THEN NULL
          ELSE genres[1]
        END,
      ALTER COLUMN genres DROP DEFAULT;
    SQL

    # Revert review_count to nullable without default
    change_column_default :venues, :review_count, from: 0, to: nil
    change_column_null :venues, :review_count, true

    # Revert rating to generic decimal and nullable
    change_column :venues, :rating, :decimal, default: nil, null: true

    # Allow name to be null again
    change_column_null :venues, :name, true
  end
end
