class Course < ApplicationRecord
  include HasYoutubeVideo
  
  extend FriendlyId

  friendly_id :title, use: :slugged
  
  belongs_to :tenant
  belongs_to :user

  before_validation -> { self.tenant ||= Current.tenant }, on: :create

  has_one :course_product, class_name: "Products::CourseProduct", dependent: :nullify
  has_one_attached :thumbnail
  has_one_attached :intro_video
  has_many :course_documents, dependent: :destroy

  alias_attribute :product_price, :price

  before_validation :normalize_enrollment_type
  validates :enrollment_type, inclusion: { in: %w[public free paid invite] }
  validates :price, numericality: { greater_than_or_equal_to: 0 }
  validates :price, numericality: { greater_than: 0 }, if: :paid_enrollment?
  validates :price, numericality: { equal_to: 0 }, if: -> { %w[public free].include?(enrollment_type) }
  validates :cover_type, inclusion: { in: %w[image video youtube] }
  validates :youtube_url, presence: true, if: -> { cover_type == "youtube" }
  validate :valid_intro_video

  after_create :create_or_update_course_product
  after_update :create_or_update_course_product

  has_many :course_modules, dependent: :destroy
  has_many :lessons, through: :course_modules
  has_many :course_module_lessons, through: :course_modules
  has_many :course_enrollments

  scope :for_tenant, ->(tenant = Current.tenant) { tenant.present? ? where(tenant_id: tenant.id) : none }
  scope :published, -> { for_tenant.where(published: true) }

  def enrolled?(user)
    user.present? && course_enrollments.exists?(user_id: user.id)
  end

  def owned_by?(viewer)
    viewer.present? && user_id == viewer.id
  end

  def visible_to?(viewer)
    published? || owned_by?(viewer)
  end

  def content_accessible_to?(viewer)
    owned_by?(viewer) || (published? && (enrollment_type == "public" || enrolled?(viewer)))
  end

  def paid_enrollment?
    enrollment_type == "paid"
  end

  def self_enrollment?
    published? && %w[public free paid].include?(enrollment_type)
  end

  def currency
    course_product&.normalized_currency || "usd"
  end
  
  def create_or_update_course_product
    if course_product
      course_product.update!(
        title: title,
        slug: slug,
        description: description,
        price: price,
        category: category
      )
    else
      Products::CourseProduct.create!(
        tenant: tenant,
        user: user,
        course: self,
        title: title,
        slug: slug,
        description: description,
        price: price,
        status: "active",
        category: category
      )
    end
  end

  private

  def valid_intro_video
    if cover_type == "video" && !intro_video.attached?
      errors.add(:intro_video, I18n.t("courses.cover.video_required"))
    elsif intro_video.attached? && !%w[video/mp4 video/webm video/quicktime].include?(intro_video.blob.content_type)
      errors.add(:intro_video, I18n.t("courses.cover.invalid_video"))
    end
  end

  def normalize_enrollment_type
    if enrollment_type.blank? || enrollment_type == "open"
      self.enrollment_type = price.to_d.positive? ? "paid" : "free"
    end
  end
end
