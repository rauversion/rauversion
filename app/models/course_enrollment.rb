class CourseEnrollment < ApplicationRecord
  belongs_to :user
  belongs_to :course

  # progress jsonb structure example:
  # {
  #   "started_lessons": [lesson_id, ...],
  #   "finished_lessons": [lesson_id, ...],
  #   "metadata": { ... }
  # }
  # 
  

  store_attribute :progress, :started_lessons, :json, default: []
  store_attribute :progress, :finished_lessons, :json, default: []

  # Enroll is handled by creation, but you can add a class method if needed
  def self.enroll(user:, course:, metadata: {})
    create(user: user, course: course, progress: { "started_lessons" => [], "finished_lessons" => [], "metadata" => metadata })
  end

  # Mark a lesson as started
  def start_lesson(lesson_id)
    self.progress ||= { "started_lessons" => [], "finished_lessons" => [], "metadata" => {} }
    self.progress["started_lessons"] ||= []
    self.progress["finished_lessons"] ||= []
    lesson_id = lesson_id.to_i

    unless self.progress["started_lessons"].include?(lesson_id)
      self.progress["started_lessons"] << lesson_id
      self.progress["started_lessons"].uniq!
    end
    # Optionally, remove from finished if re-started
    self.progress["finished_lessons"].delete(lesson_id)
    save!
  end

  # Mark a lesson as finished
  def finish_lesson(lesson_id)
    self.progress ||= { "started_lessons" => [], "finished_lessons" => [], "metadata" => {} }
    self.progress["started_lessons"] ||= []
    self.progress["finished_lessons"] ||= []
    lesson_id = lesson_id.to_i

    unless self.progress["started_lessons"].include?(lesson_id)
      self.progress["started_lessons"] << lesson_id
    end
    unless self.progress["finished_lessons"].include?(lesson_id)
      self.progress["finished_lessons"] << lesson_id
      self.progress["finished_lessons"].uniq!
    end
    save!
  end

  # Check if a lesson is started
  def lesson_started?(lesson_id)
    self.progress && self.progress["started_lessons"]&.include?(lesson_id.to_i)
  end

  # Check if a lesson is finished
  def lesson_finished?(lesson_id)
    self.progress && self.progress["finished_lessons"]&.include?(lesson_id.to_i)
  end

  # Get progress for a lesson (returns :not_started, :started, :finished)
  def progress_for_lesson(lesson_id)
    return :finished if lesson_finished?(lesson_id)
    return :started if lesson_started?(lesson_id)
    :not_started
  end

  # Reset all progress
  def reset_progress!
    self.progress = { "started_lessons" => [], "finished_lessons" => [], "metadata" => {} }
    save!
  end

  # Update metadata in progress
  def update_metadata!(new_metadata)
    self.progress ||= { "started_lessons" => [], "finished_lessons" => [], "metadata" => {} }
    self.progress["metadata"] ||= {}
    self.progress["metadata"].merge!(new_metadata)
    save!
  end

  # Returns Lesson records that are completed
  def completed_lessons
    lesson_ids = (self.progress && self.progress["finished_lessons"]) || []
    Lesson.where(id: lesson_ids)
  end

  # Returns Lesson records that are not completed
  def remaining_lessons
    all_lesson_ids = course.course_modules.includes(:lessons).flat_map { |m| m.lessons.pluck(:id) }
    finished_ids = (self.progress && self.progress["finished_lessons"]) || []
    Lesson.where(id: all_lesson_ids - finished_ids)
  end

  # Returns overall progress as a float (0.0 - 1.0)
  def overall_progress
    all_lesson_ids = course.course_modules.includes(:lessons).flat_map { |m| m.lessons.pluck(:id) }
    return 0.0 if all_lesson_ids.empty?
    finished_ids = (self.progress && self.progress["finished_lessons"]) || []
    (finished_ids & all_lesson_ids).size.to_f / all_lesson_ids.size
  end

  # Returns a hash of module_id => { completed: n, total: m, percent: x }
  def module_progress
    finished_ids = (self.progress && self.progress["finished_lessons"]) || []
    course.course_modules.includes(:lessons).each_with_object({}) do |mod, hash|
      lesson_ids = mod.lessons.pluck(:id)
      completed = (lesson_ids & finished_ids).size
      total = lesson_ids.size
      percent = total > 0 ? completed.to_f / total : 0.0
      hash[mod.id] = { completed: completed, total: total, percent: (percent * 100).round(2) }
    end
  end
end
