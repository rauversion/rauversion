json.course_modules @course_modules.map { |mod| 
  {
    id: mod.id,
    title: mod.title,
    description: mod.description,
    position: mod.position,
    lessons: mod.lessons.map { |lesson|
      {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        type: lesson.type,
        video_url: lesson.video.attached? ? url_for(lesson.video) : nil,
        documents: lesson.course_documents.map { |doc|
          {
            id: doc.id,
            title: doc.title,
            file_url: doc.file.attached? ? url_for(doc.file) : nil,
            created_at: doc.created_at,
            updated_at: doc.updated_at
          }
        }
      }
    }
  }
}
