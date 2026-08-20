class ServiceBookingsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_service_booking, only: [:show, :confirm, :schedule_form, :schedule, :complete, :cancel, :refund, :update, :feedback_form, :mark_deposit_paid, :confirm_deposit, :mark_balance_paid, :confirm_balance, :deposit_checkout, :balance_checkout]
  before_action :ensure_customer_or_provider, only: [:show, :update, :feedback_form, :mark_deposit_paid, :confirm_deposit, :mark_balance_paid, :confirm_balance, :deposit_checkout, :balance_checkout]
  before_action :ensure_provider, only: [:confirm, :schedule_form, :schedule, :complete, :cancel, :refund]

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

  def refund
    unless @service_booking.may_refund?
      return respond_to do |format|
        format.html do
          flash[:alert] = t('.invalid_status')
          redirect_to service_bookings_path
        end
        format.json { render json: { success: false, error: t('.invalid_status') }, status: :unprocessable_entity }
      end
    end

    @service_booking.mark_refund_processing!(actor: current_user)

    refund_id = nil
    if @service_booking.checkout_provider == "stripe"
      if @service_booking.payment_intent_id.blank?
        @service_booking.mark_refund_failed!(
          actor: current_user,
          error: "payment intent not found"
        )
        return respond_to do |format|
          format.html do
            flash[:alert] = "Refund failed: payment intent not found"
            redirect_to service_booking_path(@service_booking)
          end
          format.json { render json: { success: false, error: "Refund failed: payment intent not found" }, status: :unprocessable_entity }
        end
      end

      stripe_refund = Stripe::Refund.create(
        payment_intent: @service_booking.payment_intent_id,
        amount: @service_booking.refund_amount_for_gateway
      )
      refund_id = stripe_refund.id
    end

    ActiveRecord::Base.transaction do
      @service_booking.mark_refunded!(refund_id: refund_id, actor: current_user)
      mark_product_purchase_refunded_if_complete!
      @service_booking.add_system_message!(
        "#{current_user.display_name} processed a refund for this booking.",
        actor: current_user
      )
    end

    respond_to do |format|
      format.html do
        flash[:notice] = t('.success')
        redirect_to service_booking_path(@service_booking)
      end
      format.json { render json: { success: true, message: t('.success') } }
    end
  rescue Stripe::StripeError => e
    @service_booking.mark_refund_failed!(actor: current_user, error: e.message)

    respond_to do |format|
      format.html do
        flash[:alert] = "Refund failed: #{e.message}"
        redirect_to service_booking_path(@service_booking)
      end
      format.json { render json: { success: false, error: "Refund failed: #{e.message}" }, status: :unprocessable_entity }
    end
  end

  def update
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
  end

  def mark_deposit_paid
    unless @service_booking.may_mark_deposit_paid?(current_user)
      return render json: { success: false, error: t('service_bookings.payment_tracking.invalid_status') }, status: :unprocessable_entity
    end

    @service_booking.mark_deposit_paid!(actor: current_user, notes: params[:notes])
    render json: { success: true, message: t('service_bookings.payment_tracking.success') }
  end

  def deposit_checkout
    unless @service_booking.may_pay_deposit_with_stripe?(current_user)
      return render json: { success: false, error: t('service_bookings.payment_tracking.invalid_status') }, status: :unprocessable_entity
    end

    result = ServiceBookings::StripeCheckout.new(booking: @service_booking, milestone: :deposit).create_session
    render_checkout_result(result)
  end

  def confirm_deposit
    unless @service_booking.may_confirm_deposit?(current_user)
      return render json: { success: false, error: t('service_bookings.payment_tracking.invalid_status') }, status: :unprocessable_entity
    end

    @service_booking.confirm_deposit!(actor: current_user, notes: params[:notes])
    render json: { success: true, message: t('service_bookings.payment_tracking.success') }
  end

  def mark_balance_paid
    unless @service_booking.may_mark_balance_paid?(current_user)
      return render json: { success: false, error: t('service_bookings.payment_tracking.invalid_status') }, status: :unprocessable_entity
    end

    @service_booking.mark_balance_paid!(actor: current_user, notes: params[:notes])
    render json: { success: true, message: t('service_bookings.payment_tracking.success') }
  end

  def balance_checkout
    unless @service_booking.may_pay_balance_with_stripe?(current_user)
      return render json: { success: false, error: t('service_bookings.payment_tracking.invalid_status') }, status: :unprocessable_entity
    end

    result = ServiceBookings::StripeCheckout.new(booking: @service_booking, milestone: :balance).create_session
    render_checkout_result(result)
  end

  def confirm_balance
    unless @service_booking.may_confirm_balance?(current_user)
      return render json: { success: false, error: t('service_bookings.payment_tracking.invalid_status') }, status: :unprocessable_entity
    end

    @service_booking.confirm_balance!(actor: current_user, notes: params[:notes])
    render json: { success: true, message: t('service_bookings.payment_tracking.success') }
  end

  def set_service_booking
    @service_booking = ServiceBooking.find(params[:id])
  end

  private

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
      :feedback,
      :starts_at,
      :ends_at,
      :venue_name,
      :venue_address,
      :city,
      :country
    )
  end

  def mark_product_purchase_refunded_if_complete!
    purchase = @service_booking.product_purchase
    return unless purchase
    return unless purchase.product_purchase_items.count == 1

    purchase.update!(status: :refunded)
  end

  def render_checkout_result(result)
    if result[:error].present?
      render json: { success: false, error: result[:error] }, status: :unprocessable_entity
    else
      render json: { success: true, checkout_url: result[:checkout_url], checkout_session_id: result[:checkout_session_id] }
    end
  end
end
