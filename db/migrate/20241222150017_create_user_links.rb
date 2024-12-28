class CreateUserLinks < ActiveRecord::Migration[7.0]
  def change
    create_table :user_links do |t|
      t.string :title
      t.string :url
      t.integer :position
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
    add_index :user_links, :position
  end
end
