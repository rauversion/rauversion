class CourseEnrollmentsController < ApplicationController
  include CourseAccess
  before_action :require_course_user!
  before_action :set_course_enrollment, only: [:show, :start_lesson, :finish_lesson]

  # POST /course_enrollments
  # Params: { course_enrollment: { course_id } }
  def create
    @course = Course.for_tenant.friendly.find(enrollment_params[:course_id])
    return head :not_found unless @course.visible_to?(current_user)

    enrollment = @course.course_enrollments.find_by(user: current_user)
    if enrollment
      return render json: { enrollment: enrollment, progress: enrollment.progress }
    end
    unless @course.self_enrollment?
      return render json: { error: I18n.t("courses.enrollment_form.enrollment_closed") }, status: :forbidden
    end

    if @course.paid_enrollment?
      result = PaymentProviders::CourseStripeProvider.new(course: @course, user: current_user).create_checkout_session
      return render json: result, status: result[:error] ? :unprocessable_entity : :ok
    end

    enrollment = @course.with_lock { @course.course_enrollments.find_or_create_by!(user: current_user) }
    if enrollment.persisted?
      render json: { enrollment: enrollment, progress: enrollment.progress }, status: :ok
    else
      render json: { error: "Could not enroll, #{enrollment.errors.full_messages}" }, status: :unprocessable_entity
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
    @course_enrollment = CourseEnrollment.where(user: current_user).joins(:course)
      .where(courses: { tenant_id: Current.tenant.id }).find(params[:id])
    @course = @course_enrollment.course
    require_course_content!
    if !performed? && params[:lesson_id].present?
      @course.lessons.find(params[:lesson_id])
    end
  end

  def enrollment_params
    params.require(:course_enrollment).permit(:course_id)
  end
end
