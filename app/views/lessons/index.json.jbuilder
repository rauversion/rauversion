json.lessons @lessons do |lesson|
  json.id lesson.id
  json.title lesson.title
  json.duration lesson.duration
  json.lesson_type lesson.lesson_type
  json.course_module_id lesson.course_module_id
  json.created_at lesson.created_at
  json.updated_at lesson.updated_at
end
