can_access = @course.content_accessible_to?(current_user)
json.course_modules @course_modules.map { |mod| 
  {
    id: mod.id,
    title: mod.title,
    description: mod.description,
    position: mod.position,
    lessons: mod.lessons.order(:position).map { |lesson|
      {
        id: lesson.id,
        title: lesson.title,
        description: can_access ? lesson.description : nil,
        duration: lesson.duration,
        type: lesson.type,
        video_url: can_access && lesson.video.attached? ? stream_course_course_module_lesson_path(@course, mod, lesson) : nil,
        youtube_url: can_access ? lesson.youtube_url : nil,
        documents: can_access ? lesson.course_documents.map { |doc|
          {
            id: doc.id,
            title: doc.title,
            name: doc.name,
            file_url: doc.file.attached? ? url_for(doc.file) : nil,
            created_at: doc.created_at,
            updated_at: doc.updated_at
          }
        } : []
      }
    }
  }
}
