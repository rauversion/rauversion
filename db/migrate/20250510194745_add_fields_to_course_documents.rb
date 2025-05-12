class AddFieldsToCourseDocuments < ActiveRecord::Migration[8.0]
  def change
    add_reference :course_documents, :course, null: false, foreign_key: true
  end
end
