class CourseDocument < ApplicationRecord
  belongs_to :lesson, optional: true
  belongs_to :course
  has_one_attached :file
end
