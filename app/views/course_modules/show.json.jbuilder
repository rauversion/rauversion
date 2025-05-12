json.course_module do
  json.id @course_module.id
  json.title @course_module.title
  json.description @course_module.description
  json.lessons @course_module.lessons.map { |lesson|
    {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration,
      type: lesson.type
    }
  }
end
