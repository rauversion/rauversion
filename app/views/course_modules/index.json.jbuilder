json.course_modules @course_modules.map { |mod| 
  {
    id: mod.id,
    title: mod.title,
    description: mod.description,
    lessons: mod.lessons.map { |lesson|
      {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        type: lesson.type,
        video_url: lesson.video.attached? ? url_for(lesson.video) : nil
      }
    }
  }
}
