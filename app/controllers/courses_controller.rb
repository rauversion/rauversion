class CoursesController < ApplicationController
  before_action :set_course, only: [:destroy]

  def index
    @courses = current_user.courses
    respond_to do |format|
      format.json { render json: @courses }
      format.html { render_blank }
    end
  end

  def show
    @course = current_user.courses.find_by(id: params[:id])
    respond_to do |format|
      format.json { render :show }
      format.html { render_blank }
    end
  end

  def create
    @course = current_user.courses.build(course_params)
    if @course.save
      render :show, status: :created
    else
      render json: { errors: @course.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    if @course.destroy
      head :no_content
    else
      render json: { errors: @course.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def edit
    @course = current_user.courses.find_by(id: params[:id])
    respond_to do |format|
      format.json { render json: @course }
      format.html { render_blank }
    end
  end

  def update
    @course = current_user.courses.find_by(id: params[:id])
    @course.assign_attributes(course_params)
    if @course.save
      render :show, status: :ok
    else
      render json: { errors: @course.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_course
    @course = current_user.courses.find(params[:id])
  end

  def course_params
    params.require(:course).permit(
      :title, :description,
      :category, 
      :level, 
      :duration, 
      :price,
      :instructor, 
      :instructor_title, 
      :is_published,
      :thumbnail
    )
  end
end
