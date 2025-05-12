json.collection @course_documents do |course_document|
  json.id course_document.id
  json.title course_document.title
  json.file_url url_for(course_document.file) if course_document.file.attached?
  json.created_at course_document.created_at
  json.updated_at course_document.updated_at
  json.course_module_id @course_module.id if @course_module
  json.lesson_id @lesson.id if @lesson
end