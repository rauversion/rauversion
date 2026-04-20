class CreateNewsletterAudienceSources < ActiveRecord::Migration[8.0]
  def change
    create_table :newsletter_audience_sources do |t|
      t.references :audience, null: false, foreign_key: { to_table: :newsletter_audiences }
      t.string :source_type, null: false
      t.jsonb :source_settings, default: {}, null: false
      t.integer :position, default: 0, null: false

      t.timestamps
    end

    add_index :newsletter_audience_sources, [:audience_id, :position]
    add_index :newsletter_audience_sources, :source_type
  end
end
