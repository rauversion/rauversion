class Course < ApplicationRecord
  
  extend FriendlyId

  friendly_id :title, use: :slugged
  
  belongs_to :user

  has_one :course_product, class_name: "Products::CourseProduct", dependent: :nullify
  has_one_attached :thumbnail
  has_many :course_documents, dependent: :destroy

  attr_accessor :product_price

  after_create :create_or_update_course_product
  after_update :create_or_update_course_product

  has_many :course_modules, dependent: :destroy
  has_many :lessons, through: :course_modules
  has_many :course_module_lessons, through: :course_modules
  has_many :course_enrollments

  scope :published, -> { where(published: true) }

  def enrolled?(user)
    course_enrollments.exists?(user_id: user.id)
  end
  
  def create_or_update_course_product
    if course_product
      course_product.update(
        title: title,
        slug: slug,
        description: description,
        price: product_price || course_product.price,
        category: category
      )
    else
      Products::CourseProduct.create!(
        user: user,
        course: self,
        title: title,
        slug: slug,
        description: description,
        price: product_price,
        status: "active",
        category: category
      )
    end
  end
end
