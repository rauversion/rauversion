class CreateCourses < ActiveRecord::Migration[8.0]
  def change
    create_table :courses do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title
      t.text :description
      t.string :category
      t.string :level
      t.string :duration
      t.decimal :price
      t.string :instructor
      t.string :instructor_title
      t.boolean :is_published

      t.timestamps
    end
  end
end
