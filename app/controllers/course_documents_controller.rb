class CourseDocumentsController < ApplicationController
  before_action :set_course
  before_action :set_course_document, only: [:show, :destroy, :download]

  def index
    @course_documents = @course.course_documents
    render json: @course_documents
  end

  def show
    render json: @course_document
  end

  def create
    if @lesson
      @course_document = @lesson.course_documents.build(course_document_params)
      @course_document.course = @course
    else
      @course_document = @course.course_documents.build(course_document_params)
    end
    if @course_document.save
      render json: @course_document, status: :created
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

  def download
    if @lesson
      @course_document = @lesson.course_documents.find(params[:id])
    else
      @course_document = @course.course_documents.find(params[:id])
    end

    if @course_document.file.attached?
      url = @course_document.file.url(expires_in: 5.seconds)
      render json: { url: url }
    else
      render json: { error: "File not found" }, status: :not_found
    end
  end

  private

  def set_course
    @course = Course.friendly.find(params[:course_id])
    @course_module = @course.course_modules.find(params[:course_module_id]) if params[:course_module_id]
    @lesson = @course_module.lessons.find(params[:lesson_id]) if params[:lesson_id]
  end

  def set_course_document
    if @lesson
      @course_document = @lesson.course_documents.find(params[:id])
    else
      @course_document = @course.course_documents.find(params[:id])
    end
  end

  def course_document_params
    params.require(:course_document).permit(:title, :name, :file)
  end
end
