class Lesson < ApplicationRecord
  belongs_to :course_module
  has_one_attached :video
  has_many :course_documents, dependent: :destroy

  self.inheritance_column = :_type_disabled

  acts_as_list scope: [:course_module_id]

end
