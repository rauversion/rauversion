class ServiceBookingProposalsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_service_booking_proposal, only: [:show, :counter, :accept, :reject, :cancel]
  before_action :ensure_participant!, only: [:show, :counter, :accept, :reject, :cancel]

  def index
    @service_booking_proposals = ServiceBookingProposal
      .for_user(current_user)
      .includes(:service_product, :booker, :artist, :service_booking)
      .order(updated_at: :desc)

    @service_booking_proposals = @service_booking_proposals.where(status: params[:status]) if params[:status].present?

    respond_to do |format|
      format.html { render_blank }
      format.json
    end
  end

  def show
    respond_to do |format|
      format.html { render_blank }
      format.json
    end
  end

  def create
    service_product = Products::ServiceProduct.find(proposal_params[:service_product_id])

    @service_booking_proposal = ServiceBookingProposal.new(
      proposal_params.except(:service_product_id).merge(
        service_product: service_product,
        booker: current_user,
        artist: service_product.user,
        current_offer_by: current_user
      )
    )

    if @service_booking_proposal.save
      render :show, status: :created
    else
      render json: { errors: @service_booking_proposal.errors }, status: :unprocessable_entity
    end
  end

  def counter
    @service_booking_proposal.counter!(actor: current_user, attributes: proposal_terms_params.to_h)
    render :show
  rescue ArgumentError, ActiveRecord::RecordInvalid => e
    render_action_error(e)
  end

  def accept
    @service_booking_proposal.accept!(actor: current_user)
    render :show
  rescue ArgumentError, ActiveRecord::RecordInvalid => e
    render_action_error(e)
  end

  def reject
    @service_booking_proposal.reject!(actor: current_user)
    render :show
  rescue ArgumentError, ActiveRecord::RecordInvalid => e
    render_action_error(e)
  end

  def cancel
    @service_booking_proposal.cancel!(actor: current_user)
    render :show
  rescue ArgumentError, ActiveRecord::RecordInvalid => e
    render_action_error(e)
  end

  private

  def set_service_booking_proposal
    @service_booking_proposal = ServiceBookingProposal.find(params[:id])
  end

  def ensure_participant!
    return if @service_booking_proposal.participant?(current_user)

    render json: { error: t("unauthorized") }, status: :forbidden
  end

  def proposal_params
    params.require(:service_booking_proposal).permit(
      :service_product_id,
      :event_name,
      :event_date,
      :starts_at,
      :ends_at,
      :venue_name,
      :venue_address,
      :city,
      :country,
      :proposed_amount,
      :currency,
      :deposit_percentage,
      :fee_type,
      :transport_included,
      :accommodation_included,
      :hospitality_included,
      :catering_included,
      :guest_list_count,
      :benefits,
      :technical_notes,
      :message
    )
  end

  def proposal_terms_params
    params.require(:service_booking_proposal).permit(
      :event_name,
      :event_date,
      :starts_at,
      :ends_at,
      :venue_name,
      :venue_address,
      :city,
      :country,
      :proposed_amount,
      :currency,
      :deposit_percentage,
      :fee_type,
      :transport_included,
      :accommodation_included,
      :hospitality_included,
      :catering_included,
      :guest_list_count,
      :benefits,
      :technical_notes,
      :message
    )
  end

  def render_action_error(error)
    message = error.respond_to?(:record) ? error.record.errors.full_messages.to_sentence : error.message
    render json: { error: message }, status: :unprocessable_entity
  end
end
