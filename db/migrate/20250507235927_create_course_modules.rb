class CreateCourseModules < ActiveRecord::Migration[8.0]
  def change
    create_table :course_modules do |t|
      t.references :course, null: false, foreign_key: true
      t.string :title
      t.text :description

      t.timestamps
    end
  end
end
