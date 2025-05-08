class CreateCourseDocuments < ActiveRecord::Migration[8.0]
  def change
    create_table :course_documents do |t|
      t.references :lesson, null: false, foreign_key: true
      t.string :title
      t.string :name

      t.timestamps
    end
  end
end
