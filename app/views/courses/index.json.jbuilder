json.collection @courses do |course|
  json.id course.id
  json.title course.title
  json.description course.description
  json.category course.category
  json.level course.level
  json.duration course.duration
  json.price course.price
  json.instructor course.instructor
  json.instructor_title course.instructor_title
  json.published course.published
  json.created_at course.created_at
  json.updated_at course.updated_at
  json.thumbnail_url url_for(course.thumbnail.variant(resize_to_limit: [800, 800])) if course.thumbnail.attached?

  json.seo_title course.seo_title
  json.seo_description course.seo_description
  json.seo_keywords course.seo_keywords
  json.max_students course.max_students
  json.enrollment_type course.enrollment_type
  json.certificate course.certificate
  json.featured course.featured
  json.published course.published
  json.slug course.slug
end

if @courses.respond_to?(:current_page)
  json.metadata do
    json.partial! 'shared/pagination_metadata', collection: @courses
  end
end
