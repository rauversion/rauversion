class CreateMessageReads < ActiveRecord::Migration[8.0]
  def change
    create_table :message_reads do |t|
      t.references :message, null: false, foreign_key: true
      t.references :participant, null: false, foreign_key: true
      t.datetime :read_at

      t.timestamps
    end
  end
end
