class CourseModule < ApplicationRecord
  belongs_to :course
  has_many :lessons, dependent: :destroy

  accepts_nested_attributes_for :lessons, allow_destroy: true

  acts_as_list scope: [:course_id]

end
