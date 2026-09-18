class AddIntroMediaToCourses < ActiveRecord::Migration[8.1]
  def change
    add_column :courses, :cover_type, :string, default: "image", null: false
    add_column :courses, :youtube_url, :string
  end
end
