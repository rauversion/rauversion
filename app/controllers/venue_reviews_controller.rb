class VenueReviewsController < ApplicationController
  before_action :set_venue, only: [:index, :create, :summary]
  before_action :set_review, only: [:show, :update, :destroy]
  before_action :authenticate_user!, only: [:create, :update, :destroy]

  # GET /venues/:venue_id/venue_reviews.json
  def index
    reviews = @venue.venue_reviews
    reviews = reviews.where(reviewer_role: params[:reviewer_role]) if params[:reviewer_role].present?
    reviews = reviews.order(created_at: :desc)
    reviews = reviews.page(params[:page]).per((params[:per] || 20).to_i) if reviews.respond_to?(:page)

    @reviews = reviews
    respond_to do |format|
      format.json
      format.any { head :not_acceptable }
    end
  end

  # GET /venue_reviews/:id.json
  def show
    respond_to do |format|
      format.json
      format.any { head :not_acceptable }
    end
  end

  # POST /venues/:venue_id/venue_reviews.json
  def create
    @review = @venue.venue_reviews.new(review_params.merge(user: current_user))

    if @review.save
      respond_to do |format|
        format.json { render :show, status: :created }
        format.any { head :created }
      end
    else
      render json: { errors: @review.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /venue_reviews/:id.json
  def update
    return render json: { error: "Forbidden" }, status: :forbidden unless owns_review?(@review)

    if @review.update(review_params)
      respond_to do |format|
        format.json { render :show, status: :ok }
        format.any { head :ok }
      end
    else
      render json: { errors: @review.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /venue_reviews/:id.json
  def destroy
    return render json: { error: "Forbidden" }, status: :forbidden unless owns_review?(@review)

    @review.destroy
    head :no_content
  end

  # GET /venues/:venue_id/venue_reviews/summary.json
  def summary
    stats = VenueRatingStat.where(venue_id: @venue.id)

    # Trend by year (derivado de bucket_on date)
    yearly_rows = stats.overall
                       .group("DATE_PART('year', bucket_on)")
                       .select("DATE_PART('year', bucket_on) AS year, SUM(sum) AS total_sum, SUM(count) AS total_count")
                       .order("year ASC")
    @trend = yearly_rows.map do |r|
      total_count = r.total_count.to_i
      avg = total_count > 0 ? (r.total_sum.to_f / total_count.to_f).round(2) : nil
      { year: r.year.to_i.to_s, rating: avg }
    end

    # Overall stats (global)
    overall = stats.overall.select("SUM(sum) AS total_sum, SUM(count) AS total_count").take
    total_sum = overall&.total_sum.to_f
    total_count = overall&.total_count.to_i
    @overall_avg = total_count > 0 ? (total_sum / total_count.to_f).round(2) : nil
    @total_reviews = total_count

    # Role counts (suma de counts por role)
    @role_counts = stats.overall.group(:reviewer_role).sum(:count)

    # Aspect averages
    aspect_rows = stats.where.not(metric: "overall")
                       .group(:metric)
                       .select("metric, SUM(sum) AS s, SUM(count) AS c")
    @aspects = aspect_rows.map do |r|
      c = r.c.to_i
      avg = c > 0 ? (r.s.to_f / c.to_f).round(2) : nil
      { name: r.metric, avg: avg, count: c }
    end.sort_by { |a| - (a[:avg] || 0) }

    respond_to do |format|
      format.json
      format.any { head :not_acceptable }
    end
  end

  private

  def set_venue
    @venue = Venue.friendly.find(params[:venue_id])
  end

  def set_review
    @review = VenueReview.find(params[:id])
  end

  def owns_review?(review)
    current_user && (review.user_id == current_user.id || current_user.try(:role) == "admin")
  end

  def review_params
    params.require(:venue_review).permit(
      :reviewer_role,
      :overall_rating,
      :comment,
      aspects: {}
    )
  end
end
