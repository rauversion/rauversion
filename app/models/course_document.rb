class CourseDocument < ApplicationRecord
  belongs_to :lesson
  has_one_attached :file
end
