module Products
  class CourseProduct < ::Product
    belongs_to :course

    # Add any course-specific product logic here
    # e.g., validations, scopes, etc.
    validates :course_id, presence: true, uniqueness: true

    def decrease_quantity(amount)
      return false
    end


    def set_course_enrollment_for(item, purchase)
      return unless purchase.completed?

      course.with_lock do
        enrollment = course.course_enrollments.find_or_create_by!(user: purchase.user)
        enrollment.update_metadata!(purchase_id: purchase.id, product_purchase_item_id: item.id)
      end
    end
  end
end
