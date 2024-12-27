class AddTagsToPost < ActiveRecord::Migration[8.0]
  def change
    add_column :posts, :tags, :string, array: true, default: []
  end
end
