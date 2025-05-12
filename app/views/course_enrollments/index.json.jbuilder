json.collection @enrollments do |course_enrollment|
  json.partial! 'course_enrollments/enrollment', locals: { course_enrollment: course_enrollment }
  json.email course_enrollment.user.email
  json.first_name course_enrollment.user.first_name
  json.last_name course_enrollment.user.last_name
  json.full_name course_enrollment.user.full_name
end