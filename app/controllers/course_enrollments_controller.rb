class CourseEnrollmentsController < ApplicationController
  before_action :set_course_enrollment, only: [:show, :start_lesson, :finish_lesson]

  # POST /course_enrollments
  # Params: { user_id, course_id, metadata (optional) }
  def create
    enrollment = CourseEnrollment.find_or_create_by(user_id: enrollment_params[:user_id], course_id: enrollment_params[:course_id])
    if enrollment.persisted?
      enrollment.update_metadata!(enrollment_params[:metadata]) if enrollment_params[:metadata]
      render json: { enrollment: enrollment, progress: enrollment.progress }, status: :ok
    else
      render json: { error: "Could not enroll" }, status: :unprocessable_entity
    end
  end

  # GET /course_enrollments/:id
  def show
    render json: { enrollment: @course_enrollment, progress: @course_enrollment.progress }
  end

  # POST /course_enrollments/:id/start_lesson
  # Params: { lesson_id }
  def start_lesson
    lesson_id = params[:lesson_id]
    if lesson_id.present?
      @course_enrollment.start_lesson(lesson_id)
      render json: { progress: @course_enrollment.progress }, status: :ok
    else
      render json: { error: "lesson_id required" }, status: :bad_request
    end
  end

  # POST /course_enrollments/:id/finish_lesson
  # Params: { lesson_id }
  def finish_lesson
    lesson_id = params[:lesson_id]
    if lesson_id.present?
      @course_enrollment.finish_lesson(lesson_id)
      render json: { progress: @course_enrollment.progress }, status: :ok
    else
      render json: { error: "lesson_id required" }, status: :bad_request
    end
  end

  private

  def set_course_enrollment
    @course_enrollment = CourseEnrollment.find(params[:id])
  end

  def enrollment_params
    params.require(:course_enrollment).permit(:user_id, :course_id, metadata: {})
  end
end
