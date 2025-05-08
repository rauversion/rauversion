class Lesson < ApplicationRecord
  belongs_to :course_module
  has_one_attached :video
  has_many :course_documents, dependent: :destroy

  inheritance_column = false
end
