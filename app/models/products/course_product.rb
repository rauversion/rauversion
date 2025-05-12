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
      # Check if the course enrollment already exists
      enrollment = CourseEnrollment.find_or_initialize_by(
        user_id: purchase.user.id,
        course_id: self.course.id
      )

      # If the enrollment is new, create it
      if enrollment.new_record?
        enrollment.save!
        # Optionally, you can send a notification or perform other actions here
      end

      # Update the metadata with the purchased item details
      enrollment.update_metadata!(item: item, purchase: purchase)
    end
  end
end
