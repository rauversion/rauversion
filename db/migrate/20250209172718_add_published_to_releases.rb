class AddPublishedToReleases < ActiveRecord::Migration[8.0]
  def change
    add_column :releases, :published, :boolean
  end
end
