class VenuesController < ApplicationController
  before_action :set_venue, only: [:show, :edit, :update, :destroy]

  def index
    @venues = Venue.order(created_at: :desc)
    respond_to do |format|
      format.html
      format.json { render json: @venues }
    end
  end

  def show
    respond_to do |format|
      format.html
      format.json { render json: @venue }
    end
  end

  def new
    @venue = Venue.new
  end

  def edit
  end

  def create
    @venue = Venue.new(venue_params)

    if @venue.save
      respond_to do |format|
        format.html { redirect_to @venue, notice: "Venue was successfully created." }
        format.json { render json: @venue, status: :created }
      end
    else
      respond_to do |format|
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: { errors: @venue.errors.full_messages }, status: :unprocessable_entity }
      end
    end
  end

  def update
    if @venue.update(venue_params)
      respond_to do |format|
        format.html { redirect_to @venue, notice: "Venue was successfully updated." }
        format.json { render json: @venue, status: :ok }
      end
    else
      respond_to do |format|
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: { errors: @venue.errors.full_messages }, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @venue.destroy
    respond_to do |format|
      format.html { redirect_to venues_url, notice: "Venue was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  private

  def set_venue
    @venue = Venue.friendly.find(params[:id])
  end

  def venue_params
    params.require(:venue).permit(
      :name, :city, :country, :capacity, :price_range, :description,
      :address, :lat, :lng, :cover_image, :image_url,
      genres: []
    )
  end
end
