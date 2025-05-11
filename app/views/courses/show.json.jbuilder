json.course do
  json.id @course.id
  json.title @course.title
  json.description @course.description
  json.category @course.category
  json.level @course.level
  json.duration @course.duration
  # Deprecated: json.price @course.price

  if @course.course_product
    json.course_product  do
      json.id @course.course_product.id
      json.price @course.course_product.price
      json.formatted_price number_to_currency(@course.course_product.price)
    end
  end
  json.instructor @course.instructor
  json.instructor_title @course.instructor_title
  json.published @course.published
  json.created_at @course.created_at
  json.updated_at @course.updated_at
  json.thumbnail_url url_for(@course.thumbnail.variant(resize_to_limit: [800, 800])) if @course.thumbnail.attached?


  json.seo_title @course.seo_title
  json.seo_description @course.seo_description
  json.seo_keywords @course.seo_keywords
  json.max_students @course.max_students
  json.enrollment_type @course.enrollment_type
  json.certificate @course.certificate
  json.featured @course.featured
  json.published @course.published
  json.slug @course.slug

  json.user do
    json.partial! 'users/user', locals: { user: @course.user }
  end

  json.thumbnail_url @course.thumbnail.variant(resize_to_limit: [800, 800]).processed.url if @course.thumbnail.attached?
end


if @course_enrollment.present?
  json.enrollment do
    json.partial! 'course_enrollments/enrollment', locals: { course_enrollment: @course_enrollment }
  end
end
