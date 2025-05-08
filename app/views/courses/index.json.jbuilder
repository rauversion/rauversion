json.courses @courses do |course|
  json.id course.id
  json.title course.title
  json.description course.description
  json.category course.category
  json.level course.level
  json.duration course.duration
  json.price course.price
  json.instructor course.instructor
  json.instructor_title course.instructor_title
  json.is_published course.is_published
  json.created_at course.created_at
  json.updated_at course.updated_at
end
