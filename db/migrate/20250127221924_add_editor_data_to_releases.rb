class AddEditorDataToReleases < ActiveRecord::Migration[8.0]
  def change
    add_column :releases, :editor_data, :jsonb
  end
end
