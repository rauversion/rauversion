class LessonsController < ApplicationController
  before_action :set_course_module
  before_action :set_lesson, only: [:destroy, :move]

  def index
    @lessons = @course_module.lessons
    render :index
  end

  def create
    @lesson = @course_module.lessons.build(lesson_params)
    if @lesson.save
      render :show, status: :created
    else
      render json: { errors: @lesson.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    if @lesson.destroy
      head :no_content
    else
      render json: { errors: @lesson.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    @lesson = @course_module.lessons.find(params[:id])
    @lesson.assign_attributes(lesson_params)
    if @lesson.save
      render :show, status: :ok
    else
      render json: { errors: @lesson.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /courses/:course_id/course_modules/:course_module_id/lessons/:id/move
  def move
    position = params[:position].to_i
    if position > 0
      @lesson.insert_at(position)
      head :no_content
    else
      render json: { errors: ["Invalid position"] }, status: :unprocessable_entity
    end
  end

  private

  def set_course_module
    @course_module = CourseModule.find(params[:course_module_id])
  end

  def set_lesson
    @lesson = @course_module.lessons.find(params[:id])
  end

  def lesson_params
    params.require(:lesson).permit(:title, :duration, :lesson_type, :description, :video, :type)
  end
end
