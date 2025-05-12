class CreateCourseEnrollments < ActiveRecord::Migration[8.0]
  def change
    create_table :course_enrollments do |t|
      t.references :user, null: false, foreign_key: true
      t.references :course, null: false, foreign_key: true
      t.jsonb :progress
      t.jsonb :metadata
      t.datetime :enrolled_at
      t.datetime :completed_at
      t.datetime :last_accessed_at
      t.string :status, default: 'enrolled'

      t.timestamps
    end
  end
end
