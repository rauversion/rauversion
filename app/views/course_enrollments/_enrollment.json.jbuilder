
if course_enrollment.present?
  json.id course_enrollment.id
  json.metadata course_enrollment.metadata
  json.progress course_enrollment.progress
  json.created_at course_enrollment.created_at
  json.updated_at course_enrollment.updated_at
  json.completed_lessons course_enrollment.completed_lessons
  json.remaining_lessons course_enrollment.remaining_lessons
  json.started_lessons course_enrollment.started_lessons
  json.finished_lessons course_enrollment.finished_lessons
  json.module_progress course_enrollment.module_progress
end
