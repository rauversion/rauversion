class ServiceBookingsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_service_booking, only: [:show, :confirm, :schedule, :complete, :cancel]
  before_action :ensure_customer_or_provider, only: [:show]
  before_action :ensure_provider, only: [:confirm, :schedule, :complete, :cancel]

  def index
    @service_bookings = case params[:filter]
    when 'customer'
      current_user.customer_service_bookings
    when 'provider'
      current_user.provider_service_bookings
    else
      ServiceBooking.where('customer_id = ? OR provider_id = ?', current_user.id, current_user.id)
    end

    @service_bookings = @service_bookings.includes(:service_product, :customer, :provider)
                                       .order(created_at: :desc)
  end

  def show
  end

  def create
    @service_product = Products::ServiceProduct.find(params[:service_product_id])
    @service_booking = ServiceBooking.new(
      service_product: @service_product,
      customer: current_user,
      provider: @service_product.user,
      metadata: booking_metadata
    )

    if @service_booking.save
      redirect_to service_booking_path(@service_booking), 
        notice: t('.success')
    else
      redirect_to service_product_path(@service_product), 
        alert: @service_booking.errors.full_messages.join(", ")
    end
  end

  # Provider actions
  def confirm
    if @service_booking.pending_confirmation?
      @service_booking.confirmed!
      redirect_to service_booking_path(@service_booking), 
        notice: t('.success')
    else
      redirect_to service_booking_path(@service_booking), 
        alert: t('.invalid_status')
    end
  end

  def schedule
    if @service_booking.confirmed? && @service_booking.update(scheduling_params)
      @service_booking.scheduled!
      redirect_to service_booking_path(@service_booking), 
        notice: t('.success')
    else
      render :show, status: :unprocessable_entity
    end
  end

  def complete
    if @service_booking.in_progress?
      @service_booking.completed!
      redirect_to service_booking_path(@service_booking), 
        notice: t('.success')
    else
      redirect_to service_booking_path(@service_booking), 
        alert: t('.invalid_status')
    end
  end

  def cancel
    if @service_booking.may_cancel?
      @service_booking.cancelled!
      # TODO: Handle refund process if needed
      redirect_to service_booking_path(@service_booking), 
        notice: t('.success')
    else
      redirect_to service_booking_path(@service_booking), 
        alert: t('.invalid_status')
    end
  end

  private

  def set_service_booking
    @service_booking = ServiceBooking.find(params[:id])
  end

  def ensure_customer_or_provider
    unless current_user == @service_booking.customer || 
           current_user == @service_booking.provider
      redirect_to root_path, alert: t('unauthorized')
    end
  end

  def ensure_provider
    unless current_user == @service_booking.provider
      redirect_to root_path, alert: t('unauthorized')
    end
  end

  def booking_metadata
    {
      special_requirements: params[:special_requirements],
      timezone: params[:timezone] || current_user.timezone
    }
  end

  def scheduling_params
    params.require(:service_booking).permit(
      :scheduled_date,
      :scheduled_time,
      :meeting_link,
      :meeting_location,
      :provider_notes
    )
  end
end
