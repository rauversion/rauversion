class Course < ApplicationRecord
  belongs_to :user
  has_many :course_modules, dependent: :destroy
end
