json.course_modules @course_modules do |mod|
  json.id mod.id
  json.title mod.title
  json.description mod.description
  json.course_id mod.course_id
  json.created_at mod.created_at
  json.updated_at mod.updated_at
end
