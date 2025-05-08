json.course_module do
  json.id @course_module.id
  json.title @course_module.title
  json.description @course_module.description
  json.course_id @course_module.course_id
  json.created_at @course_module.created_at
  json.updated_at @course_module.updated_at
end
