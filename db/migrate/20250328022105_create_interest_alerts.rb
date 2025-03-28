class CreateInterestAlerts < ActiveRecord::Migration[8.0]
  def change
    create_table :interest_alerts do |t|
      t.references :user, null: false, foreign_key: true
      t.text :body, null: false
      t.string :role, null: false
      t.boolean :approved, default: false, null: false

      t.timestamps
    end
  end
end
