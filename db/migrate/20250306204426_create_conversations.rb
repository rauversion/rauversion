class CreateConversations < ActiveRecord::Migration[8.0]
  def change
    create_table :conversations do |t|
      t.string :subject
      t.references :messageable, polymorphic: true, null: false
      t.string :status

      t.timestamps
    end
  end
end
