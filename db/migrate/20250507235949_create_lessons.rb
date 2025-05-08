class CreateLessons < ActiveRecord::Migration[8.0]
  def change
    create_table :lessons do |t|
      t.references :course_module, null: false, foreign_key: true
      t.string :title
      t.string :duration
      t.string :lesson_type

      t.timestamps
    end
  end
end
