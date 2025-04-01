class ServiceBookingsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_service_booking, only: [:show, :confirm, :schedule_form, :schedule, :complete, :cancel]
  before_action :ensure_customer_or_provider, only: [:show]
  before_action :ensure_provider, only: [:confirm, :schedule_form, :schedule, :complete, :cancel]

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

    respond_to do |format|
      format.html
      format.json
    end
  end

  def show
    respond_to do |format|
      format.html
      format.json
    end
  end

  def confirm
    if @service_booking.pending_confirmation?
      if @service_booking.update(status: :confirmed)
        respond_to do |format|
          format.html do
            flash[:notice] = t('.success')
            redirect_to service_bookings_path
          end
          format.json { render json: { success: true, message: t('.success') } }
        end
      else
        respond_to do |format|
          format.html do
            flash[:alert] = @service_booking.errors.full_messages.to_sentence
            redirect_to service_bookings_path
          end
          format.json { render json: { success: false, errors: @service_booking.errors.full_messages }, status: :unprocessable_entity }
        end
      end
    else
      respond_to do |format|
        format.html do
          flash[:alert] = t('.invalid_status')
          redirect_to service_bookings_path
        end
        format.json { render json: { success: false, error: t('.invalid_status') }, status: :unprocessable_entity }
      end
    end
  end

  def schedule_form
    if @service_booking.confirmed?
      render partial: 'schedule_form', layout: false
    else
      redirect_to service_bookings_path, alert: t('.invalid_status')
    end
  end

  def schedule
    if @service_booking.confirmed?
      if @service_booking.update(schedule_params.merge(status: :scheduled))
        respond_to do |format|
          format.html do
            flash[:notice] = t('.success')
            redirect_to service_bookings_path
          end
          format.json { render json: { success: true, message: t('.success') } }
        end
      else
        respond_to do |format|
          format.html do
            flash[:alert] = @service_booking.errors.full_messages.to_sentence
            redirect_to service_bookings_path
          end
          format.json { render json: { success: false, errors: @service_booking.errors.full_messages }, status: :unprocessable_entity }
        end
      end
    else
      respond_to do |format|
        format.html do
          flash[:alert] = t('.invalid_status')
          redirect_to service_bookings_path
        end
        format.json { render json: { success: false, error: t('.invalid_status') }, status: :unprocessable_entity }
      end
    end
  end

  def complete
    if @service_booking.scheduled?
      if @service_booking.update(status: :completed)
        respond_to do |format|
          format.html do
            flash[:notice] = t('.success')
            redirect_to service_bookings_path
          end
          format.json { render json: { success: true, message: t('.success') } }
        end
      else
        respond_to do |format|
          format.html do
            flash[:alert] = @service_booking.errors.full_messages.to_sentence
            redirect_to service_bookings_path
          end
          format.json { render json: { success: false, errors: @service_booking.errors.full_messages }, status: :unprocessable_entity }
        end
      end
    else
      respond_to do |format|
        format.html do
          flash[:alert] = t('.invalid_status')
          redirect_to service_bookings_path
        end
        format.json { render json: { success: false, error: t('.invalid_status') }, status: :unprocessable_entity }
      end
    end
  end

  def cancel
    if @service_booking.may_cancel?
      if @service_booking.update(
        status: :cancelled,
        cancelled_by: current_user,
        cancellation_reason: params[:cancellation_reason]
      )
        respond_to do |format|
          format.html do
            flash[:notice] = t('.success')
            redirect_to service_bookings_path
          end
          format.json { render json: { success: true, message: t('.success') } }
        end
      else
        respond_to do |format|
          format.html do
            flash[:alert] = @service_booking.errors.full_messages.to_sentence
            redirect_to service_bookings_path
          end
          format.json { render json: { success: false, errors: @service_booking.errors.full_messages }, status: :unprocessable_entity }
        end
      end
    else
      respond_to do |format|
        format.html do
          flash[:alert] = t('.invalid_status')
          redirect_to service_bookings_path
        end
        format.json { render json: { success: false, error: t('.invalid_status') }, status: :unprocessable_entity }
      end
    end
  end

  def update
    @service_booking = ServiceBooking.find(params[:id])
    if @service_booking.update(schedule_params)
      respond_to do |format|
        format.html do
          redirect_to service_bookings_path, notice: t('.feedback_submitted')
        end
        format.json { render json: { success: true, message: t('.feedback_submitted') } }
      end
    else
      respond_to do |format|
        format.html { render :show, status: :unprocessable_entity }
        format.json { render json: { success: false, errors: @service_booking.errors.full_messages }, status: :unprocessable_entity }
      end
    end
  end

  def feedback_form
    @service_booking = ServiceBooking.find(params[:id])
  end

  private

  def set_service_booking
    @service_booking = ServiceBooking.find(params[:id])
  end

  def ensure_customer_or_provider
    unless [@service_booking.customer, @service_booking.provider].include?(current_user)
      flash[:alert] = t('unauthorized')
      redirect_to root_path
    end
  end

  def ensure_provider
    unless @service_booking.provider == current_user
      flash[:alert] = t('unauthorized')
      redirect_to root_path
    end
  end

  def schedule_params
    params.require(:service_booking).permit(
      :scheduled_date,
      :scheduled_time,
      :timezone,
      :meeting_link,
      :meeting_location,
      :provider_notes,
      :meeting_link,
      :rating,
      :feedback
    )
  end
end
