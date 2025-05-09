class CourseModulesController < ApplicationController
  before_action :set_course
  before_action :set_course_module, only: [:destroy]

  def index
    @course_modules = @course.course_modules
    render :index
  end

  def create
    @course_module = @course.course_modules.build(course_module_params)
    if @course_module.save
      render :show, status: :created
    else
      render json: { errors: @course_module.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    @course_module = @course.course_modules.find(params[:id])
    @course_module.assign_attributes(course_module_params)
    if @course_module.save
      render :show, status: :ok
    else
      render json: { errors: @course_module.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    if @course_module.destroy
      head :no_content
    else
      render json: { errors: @course_module.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_course
    @course = current_user.courses.find(params[:course_id])
  end

  def set_course_module
    @course_module = @course.course_modules.find(params[:id])
  end

  def course_module_params
    params.require(:course_module).permit(:title, :description)
  end
end
