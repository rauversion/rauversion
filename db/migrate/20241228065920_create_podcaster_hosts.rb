class CreatePodcasterHosts < ActiveRecord::Migration[7.1]
  def change
    create_table :podcaster_hosts do |t|
      t.references :user, null: false, foreign_key: true
      t.references :podcaster_info, null: false, foreign_key: true
      t.string :role, default: 'host'
      t.timestamps
    end

    add_index :podcaster_hosts, [:user_id, :podcaster_info_id], unique: true
  end
end
