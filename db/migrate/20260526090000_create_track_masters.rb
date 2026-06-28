class CreateTrackMasters < ActiveRecord::Migration[8.0]
  def change
    create_table :track_masters do |t|
      t.references :track, null: false, foreign_key: true
      t.string :target_profile, null: false, default: "demo_balanced"
      t.string :state, null: false, default: "pending"
      t.text :feedback
      t.text :reference_notes
      t.jsonb :recipe, null: false, default: {}
      t.jsonb :analysis_before, null: false, default: {}
      t.jsonb :analysis_after, null: false, default: {}
      t.text :error_message
      t.datetime :started_at
      t.datetime :completed_at
      t.datetime :failed_at

      t.timestamps
    end

    add_index :track_masters, [:track_id, :created_at]
    add_index :track_masters, :state
    add_index :track_masters, :target_profile
  end
end
