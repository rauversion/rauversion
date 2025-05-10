json.lesson do
  json.id @lesson.id
  json.course_module_id @lesson.course_module_id
  json.title @lesson.title
  json.duration @lesson.duration
  json.lesson_type @lesson.lesson_type
  json.created_at @lesson.created_at
  json.updated_at @lesson.updated_at
  json.description @lesson.description
  json.type @lesson.type
  json.position @lesson.position
  json.video_url url_for(@lesson.video) if @lesson.video.attached?
end

json.course_module do
  json.id @course_module.id
  json.course_id @course_module.course_id
  json.title @course_module.title
  json.description @course_module.description
  json.created_at @course_module.created_at
  json.updated_at @course_module.updated_at
  json.position @course_module.position
  json.lessons @course_module.lessons.map do |lesson|
    json.id lesson.id
    json.title lesson.title
    json.description lesson.description
    json.duration lesson.duration
    json.lesson_type lesson.lesson_type
    json.video_url lesson.video.attached? ? rails_storage_proxy_path(lesson.video) : nil
  end
end

if @course_enrollment.present?
  json.partial! 'course_enrollments/enrollment', locals: { course_enrollment: @course_enrollment }
end