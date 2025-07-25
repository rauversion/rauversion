class CreatePages < ActiveRecord::Migration[8.0]
  def change
    create_table :pages do |t|
      t.jsonb :body
      t.string :title
      t.string :slug
      t.boolean :published
      t.string :menu
      t.jsonb :settings

      t.timestamps
    end
    add_index :pages, :slug
  end
end
