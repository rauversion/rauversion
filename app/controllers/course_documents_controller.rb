class CourseDocumentsController < ApplicationController
  before_action :set_course
  before_action :set_course_document, only: [:show, :destroy]

  def index
    @course_documents = @course.course_documents
    render :index
  end

  def show
    render :show
  end

  def create
    @course_document = @lesson.course_documents.build(course_document_params)
    if @course_document.save
      render :show, status: :created
    else
      render json: { errors: @course_document.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    if @course_document.destroy
      head :no_content
    else
      render json: { errors: @course_document.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_course
    @course = Course.find(params[:course_id])
    @course_module = @course.course_modules.find(params[:course_module_id]) if params[:course_module_id]
    @lesson = @course_module.lessons.find(params[:lesson_id]) if params[:lesson_id]
  end

  def set_course_document
    @course_document = @lesson.course_documents.find(params[:id])
  end

  def course_document_params
    params.require(:course_document).permit(:title, :file)
  end
end
