class LessonsController < ApplicationController
  before_action :set_course_module
  before_action :set_lesson, only: [:destroy, :move, :stream]

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

  # include ActiveStorage::Streaming
  include ActionController::Live
  include ActionController::DataStreaming
  MAX_RANGE_SIZE = 1.megabyte
  def stream
    # authorize! @video # or any auth logic
    # send_blob_stream @lesson.video.blob, disposition: "inline"

    range_header = request.headers["Range"]

    if range_header.present?
      serve_limited_range(@lesson.video.blob, range_header)
    else
      head :range_not_satisfiable
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

  def serve_limited_range(blob, range_header)
    ranges = Rack::Utils.get_byte_ranges(range_header, blob.byte_size)

    return head :range_not_satisfiable if ranges.blank? || ranges.all?(&:blank?)

    range = ranges.first
    from = range.begin
    to = [from + MAX_RANGE_SIZE - 1, blob.byte_size - 1].min

    limited_range = (from..to)

    chunk = blob.download_chunk(limited_range)

    response.headers["Content-Type"] = blob.content_type_for_serving
    response.headers["Content-Range"] = "bytes #{from}-#{to}/#{blob.byte_size}"
    response.headers["Accept-Ranges"] = "bytes"
    response.headers["Content-Length"] = chunk.bytesize.to_s
    response.status = :partial_content

    send_data chunk,
      filename: blob.filename.sanitized,
      disposition: "inline",
      status: :partial_content,
      type: blob.content_type_for_serving
  end
end
