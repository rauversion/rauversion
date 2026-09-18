module CourseAccess
  extend ActiveSupport::Concern

  private

  def require_course_user!
    render json: { error: I18n.t("courses.access.login_required") }, status: :unauthorized unless current_user
  end

  def require_course_owner!
    return if @course.owned_by?(current_user)

    render json: { error: I18n.t("courses.access.owner_required") }, status: :forbidden
  end

  def require_visible_course!
    head :not_found unless @course.visible_to?(current_user)
  end

  def require_course_content!
    return if @course.content_accessible_to?(current_user)

    render json: { error: I18n.t("courses.access.enrollment_required"), course_id: @course.to_param }, status: :forbidden
  end
end
