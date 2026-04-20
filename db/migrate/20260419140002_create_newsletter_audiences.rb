class CreateNewsletterAudiences < ActiveRecord::Migration[8.0]
  def change
    create_table :newsletter_audiences do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false

      t.timestamps
    end

    add_index :newsletter_audiences, [:user_id, :name], unique: true
  end
end
