class CoursesController < ApplicationController
  before_action :set_course, only: [:destroy]

  def index
    respond_to do |format|
      format.json { 
        @courses = current_user.courses.page(params[:page]).per(10)
        render :index 
      }
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

  def show_lesson
    @course = current_user.courses.find_by(id: params[:course_id])
    if @course
      @lesson = @course.lessons.find(params[:lesson_id])
      @course_module = @lesson.course_module
      @lessons = @course_module.lessons
      respond_to do |format|
        format.json { render "lessons/show_lessons" }
        format.html { render_blank }
      end
      
    else
      render json: { error: 'Course not found' }, status: :not_found
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
      :thumbnail,
      :seo_title,
      :seo_description,
      :seo_keywords,
      :max_students,
      :enrollment_type,
      :certificate,
      :featured,
      :published,
      :slug
    )
  end
end
