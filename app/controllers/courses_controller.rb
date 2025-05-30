class CoursesController < ApplicationController
  before_action :set_course, only: [:destroy, :enrollments, :invite]

  def index
    respond_to do |format|
      format.json { 
        @courses = Course.published.page(params[:page]).per(10)
        render :index 
      }
      format.html { render_blank }
    end
  end

  def mine
    respond_to do |format|
      format.json { 
        @courses = current_user.courses.page(params[:page]).per(10)
        render :index 
      }
      format.html { render_blank }
    end
  end

  def show
    @course = current_user.courses.friendly.find(params[:id]) if current_user
    if @course.nil?
      @course = Course.friendly.find(params[:id])
    end
    if params[:get_enrollment] && current_user
      @course_enrollment = CourseEnrollment.find_by(
        user_id: current_user.id, 
        course_id: @course.id
      )
    end

    get_meta_tags if @course

    respond_to do |format|
      format.json { render :show }
      format.html { render_blank }
    end
  end

  def create
    @course = current_user.courses.build(course_params.except(:price))
    @course.product_price = course_params[:price]
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
    @course = current_user.courses.friendly.find(params[:id])
    respond_to do |format|
      format.json { render json: @course }
      format.html { render_blank }
    end
  end

  def update
    @course = current_user.courses.friendly.find(params[:id])
    @course.assign_attributes(course_params.except(:price))
    @course.product_price = course_params[:price]
    if @course.save
      render :show, status: :ok
    else
      render json: { errors: @course.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def show_lesson
    @course = current_user.courses.friendly.find(params[:course_id]) if current_user
    if @course.nil?
      @course = Course.friendly.find(params[:course_id])
    end

    if @course
      @lesson = @course.lessons.find(params[:lesson_id])
      @course_module = @lesson.course_module
      @lessons = @course_module.lessons

      @course_enrollment = CourseEnrollment.find_by(
        user_id: current_user.id,
        course_id: @course.id
      ) if current_user

      respond_to do |format|
        format.json { render "lessons/show_lessons" }
        format.html { render_blank }
      end
      
    else
      render json: { error: 'Course not found' }, status: :not_found
    end
  end

  # GET /courses/:id/enrollments
  def enrollments
    @course = current_user.courses.friendly.find(params[:id])
    if @course
      @enrollments = @course.course_enrollments.includes(:user)
      respond_to do |format|
        format.json { render "course_enrollments/index" }
      end
    else
      render json: { error: "Course not found" }, status: :not_found
    end
  end

  # POST /courses/:id/invite
  def invite
    email = params[:email].to_s.strip.downcase
    if email.blank?
      return render json: { error: "Email is required" }, status: :unprocessable_entity
    end

    pass = SecureRandom.hex(16)
    username = email.split('@').first
    user = User.find_by(email: email) || User.create(email: email, password: pass, password_confirmation: pass, username: "#{username}-#{Time.now.to_i}" )
    
    puts "AAAAAAA"
    puts user.errors.full_messages if user.errors.any?
    enrollment = @course.course_enrollments.find_by(user_id: user.id)

    if enrollment
      render json: { error: "User already enrolled" }, status: :unprocessable_entity
    else
      enrollment = @course.course_enrollments.create(user_id: user.id)
      if enrollment.persisted?
        render json: { success: true, enrollment: enrollment }, status: :created
      else
        render json: { error: enrollment.errors.full_messages }, status: :unprocessable_entity
      end
    end
  end

  private

  def set_course

    @course = current_user.courses.friendly.find(params[:id]) if current_user
    if @course.nil?
      @course = Course.friendly.find(params[:id])
    end
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

  def get_meta_tags
    set_meta_tags(
      title: @course.seo_title.presence || "#{@course.title} on Rauversion",
      description: @course.seo_description.presence || @course.description,
      keywords: @course.seo_keywords.presence || @course.category,
      image: @course.thumbnail.url,
      twitter: {
        card: "summary_large_image",
        title: @course.seo_title.presence || @course.title,
        description: @course.seo_description.presence || @course.description,
        image: @course.thumbnail.url
      }
    )
  end
end
