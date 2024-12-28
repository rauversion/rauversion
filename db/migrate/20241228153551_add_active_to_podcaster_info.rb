class AddActiveToPodcasterInfo < ActiveRecord::Migration[8.0]
  def change
    add_column :podcaster_infos, :active, :boolean
  end
end
