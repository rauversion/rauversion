class Course < ApplicationRecord
  belongs_to :user

  has_one_attached :thumbnail
  has_many :course_documents, dependent: :destroy
  has_many :course_modules, dependent: :destroy
  has_many :lessons, through: :course_modules
  has_many :course_module_lessons, through: :course_modules
  has_many :course_enrollments

end
