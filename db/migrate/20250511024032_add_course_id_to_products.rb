class AddCourseIdToProducts < ActiveRecord::Migration[8.0]
  def change
    add_column :products, :course_id, :bigint
    add_index :products, :course_id
  end
end
