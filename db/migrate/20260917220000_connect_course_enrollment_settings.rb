class ConnectCourseEnrollmentSettings < ActiveRecord::Migration[8.1]
  def up
    execute <<~SQL
      UPDATE courses SET price = COALESCE(
        (SELECT products.price FROM products WHERE products.course_id = courses.id
          AND products.type = 'Products::CourseProduct' AND products.deleted_at IS NULL LIMIT 1),
        courses.price, 0
      )
    SQL
    execute <<~SQL
      UPDATE courses SET enrollment_type = CASE
        WHEN enrollment_type IN ('invite', 'approval') THEN 'invite'
        WHEN enrollment_type = 'public' AND price = 0 THEN 'public'
        WHEN enrollment_type IS NULL OR enrollment_type IN ('', 'open', 'public', 'free', 'paid')
          THEN CASE WHEN price > 0 THEN 'paid' ELSE 'free' END
        ELSE 'invite'
      END
    SQL
    change_column_default :courses, :price, from: nil, to: 0
    change_column_null :courses, :price, false
    add_index :course_enrollments, [:course_id, :user_id], unique: true
  end

  def down
    remove_index :course_enrollments, [:course_id, :user_id]
    change_column_null :courses, :price, true
    change_column_default :courses, :price, from: 0, to: nil
    execute "UPDATE courses SET enrollment_type = 'open' WHERE enrollment_type IN ('free', 'paid')"
  end
end
