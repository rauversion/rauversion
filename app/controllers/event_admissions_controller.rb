class EventAdmissionsController < ApplicationController
  class AdmissionError < StandardError; end

  before_action :authenticate_user!
  before_action :set_event
  before_action :authorize_manager!

  def show
    respond_to do |format|
      format.html { render inline: "", layout: "react" }
      format.json { render json: base_payload }
    end
  end

  def scan
    purchased_ticket = find_purchased_ticket!(params[:code])

    render json: base_payload.merge(ticket: ticket_payload(purchased_ticket))
  rescue AdmissionError => e
    render json: base_payload.merge(error: e.message), status: :unprocessable_entity
  end

  def update
    purchased_ticket = find_purchased_ticket!(params[:signed_ticket_id].presence || params[:code])
    desired_checked_in = if params.key?(:checked_in)
      params[:checked_in]
    else
      !purchased_ticket.checked_in?
    end

    purchased_ticket.set_checked_in!(desired_checked_in)

    render json: base_payload.merge(ticket: ticket_payload(purchased_ticket.reload))
  rescue AdmissionError => e
    render json: base_payload.merge(error: e.message), status: :unprocessable_entity
  rescue PurchasedItem::CheckInError => e
    render json: base_payload.merge(ticket: ticket_payload(purchased_ticket), errors: [e.message]), status: :unprocessable_entity
  end

  private

  def set_event
    @event = Event.friendly.find(params[:event_id])
  end

  def authorize_manager!
    return if @event.can_access_admission?(current_user)

    respond_to do |format|
      format.html { redirect_to root_path, alert: "Unauthorized" }
      format.json { render json: { error: "Unauthorized" }, status: :unauthorized }
    end
  end

  def admission_scope
    @admission_scope ||= @event.purchased_items
                              .where(purchased_item_type: "EventTicket")
                              .includes(:purchased_item, purchase: :user)
  end

  def paid_scope
    @paid_scope ||= admission_scope.where(state: "paid")
  end

  def summary_payload
    total_paid_count = paid_scope.count
    checked_in_count = paid_scope.where(checked_in: true).count

    {
      total_paid_count: total_paid_count,
      checked_in_count: checked_in_count,
      remaining_count: [total_paid_count - checked_in_count, 0].max,
      pending_count: admission_scope.where(state: "pending").count,
      refunded_count: admission_scope.where(state: "refunded").count
    }
  end

  def recent_activity_payload
    paid_scope.where(checked_in: true)
              .order(checked_in_at: :desc)
              .limit(8)
              .map { |item| recent_activity_item(item) }
  end

  def recent_activity_item(item)
    {
      id: item.id,
      checked_in_at: item.checked_in_at,
      attendee_name: attendee_name_for(item.purchase),
      attendee_email: attendee_email_for(item.purchase),
      ticket_title: item.purchased_item.title
    }
  end

  def event_payload
    {
      id: @event.id,
      slug: @event.slug,
      title: @event.title,
      event_dates: @event.event_dates,
      location: @event.location
    }
  end

  def base_payload
    {
      viewer_role: viewer_role,
      viewer_permissions: viewer_permissions,
      event: event_payload,
      summary: summary_payload,
      recent_activity: recent_activity_payload
    }
  end

  def viewer_role
    @event.viewer_access_role_for(current_user)
  end

  def viewer_permissions
    {
      can_access_reports: @event.can_access_reports?(current_user),
      can_access_attendees: @event.can_access_attendees?(current_user),
      can_access_admission: @event.can_access_admission?(current_user),
      can_create_invitations: @event.can_manage_attendee_invitations?(current_user),
      can_export_attendees: @event.can_export_attendees?(current_user),
      can_refund_attendees: @event.can_refund_attendees?(current_user)
    }
  end

  def ticket_payload(item)
    purchase = item.purchase
    ticket = item.purchased_item

    {
      signed_ticket_id: item.signed_id,
      purchased_item_id: item.id,
      admission_status: admission_status_for(item),
      admission_message: admission_message_for(item),
      checked_in: item.checked_in?,
      checked_in_at: item.checked_in_at,
      can_toggle_check_in: item.paid?,
      next_action: item.checked_in? ? "uncheck" : "check_in",
      ticket_title: ticket.title,
      ticket_price: item.price,
      ticket_currency: item.currency,
      purchase_state: item.state,
      attendee_name: attendee_name_for(purchase),
      attendee_email: attendee_email_for(purchase)
    }
  end

  def admission_status_for(item)
    return "refunded" if item.refunded?
    return "pending_payment" unless item.paid?
    return "already_checked_in" if item.checked_in?

    "valid"
  end

  def admission_message_for(item)
    case admission_status_for(item)
    when "refunded"
      "Este ticket fue reembolsado"
    when "pending_payment"
      "El pago de este ticket sigue pendiente"
    when "already_checked_in"
      "El ingreso ya fue registrado"
    else
      "Ticket valido para ingresar"
    end
  end

  def attendee_name_for(purchase)
    user = purchase.user
    user&.display_name.presence || user&.full_name.presence || purchase.guest_email.to_s
  end

  def attendee_email_for(purchase)
    purchase.user&.email.presence || purchase.guest_email.to_s
  end

  def find_purchased_ticket!(code)
    signed_ticket_id = extract_signed_ticket_id(code)
    purchased_ticket = PurchasedItem.find_signed(signed_ticket_id)

    raise AdmissionError, "No pudimos validar este QR" if purchased_ticket.blank?
    raise AdmissionError, "Este QR no corresponde a un ticket de evento" unless purchased_ticket.purchased_item_type == "EventTicket"
    raise AdmissionError, "Este QR pertenece a otro evento" unless purchased_ticket.purchase.purchasable == @event

    purchased_ticket
  end

  def extract_signed_ticket_id(code)
    raw_value = code.to_s.strip
    raise AdmissionError, "Escanea un QR valido o pega el enlace del ticket" if raw_value.blank?

    match = raw_value.match(%r{\A(?:https?://[^/]+)?/events/[^/]+/event_tickets/([^/?#]+)})
    return CGI.unescape(match[1]) if match

    return CGI.unescape(raw_value) unless raw_value.include?("/")

    raise AdmissionError, "Formato de QR invalido"
  end
end
