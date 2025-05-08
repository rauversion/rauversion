class AddFieldsToCourse < ActiveRecord::Migration[8.0]
  def change
    add_column :courses, :seo_title, :string
    add_column :courses, :seo_description, :text
    add_column :courses, :seo_keywords, :string
    add_column :courses, :max_students, :integer, default: 0
    add_column :courses, :enrollment_type, :string
    add_column :courses, :certificate, :boolean
    add_column :courses, :featured, :boolean
    add_column :courses, :published, :boolean
    add_column :courses, :slug, :string
  end
end
