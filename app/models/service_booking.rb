class ServiceBooking < ApplicationRecord
  has_many :conversations, as: :messageable
  belongs_to :service_product, class_name: 'Products::ServiceProduct'
  belongs_to :customer, class_name: 'User'
  belongs_to :provider, class_name: 'User'
  belongs_to :cancelled_by, class_name: 'User', optional: true
  belongs_to :product_purchase, optional: true
  belongs_to :product_purchase_item, optional: true
  has_one :service_booking_proposal, dependent: :nullify
  has_many :ledger_entries,
    -> { order(:occurred_at, :id) },
    class_name: "ServiceBookingLedgerEntry",
    dependent: :delete_all

  enum :status, {
    pending_confirmation: 'pending_confirmation',   # Initial state when customer books
    confirmed: 'confirmed',                        # Provider confirms the booking
    scheduled: 'scheduled',                        # Date and time confirmed
    in_progress: 'in_progress',                    # Service is being delivered
    completed: 'completed',                        # Service has been delivered
    cancelled: 'cancelled',                        # Booking was cancelled
    refunded: 'refunded'                          # Payment was refunded
  }

  enum :payment_status, {
    unpaid: 'unpaid',
    pending: 'pending',
    paid: 'paid',
    partially_refunded: 'partially_refunded',
    refunded: 'refunded',
    failed: 'failed'
  }, prefix: :payment

  enum :refund_status, {
    not_requested: 'not_requested',
    requested: 'requested',
    processing: 'processing',
    refunded: 'refunded',
    failed: 'failed'
  }, prefix: :refund

  enum :contract_status, {
    not_generated: 'not_generated',
    auto_signed: 'auto_signed',
    voided: 'voided'
  }, prefix: :contract

  enum :deposit_status, {
    unpaid: 'unpaid',
    checkout_created: 'checkout_created',
    reported: 'reported',
    confirmed: 'confirmed'
  }, prefix: :deposit

  enum :balance_status, {
    unpaid: 'unpaid',
    checkout_created: 'checkout_created',
    reported: 'reported',
    confirmed: 'confirmed'
  }, prefix: :balance

  # For scheduling
  store_accessor :metadata,
    :scheduled_date,
    :scheduled_time,
    :timezone,
    :meeting_link,                                # For online services
    :meeting_location,                            # For in-person services
    :special_requirements,                        # Customer's special requirements
    :provider_notes,                              # Provider's private notes
    :cancellation_reason                          # Reason for cancellation

  validates :status, presence: true
  validates :scheduled_date, presence: true, if: :scheduled?
  validates :scheduled_time, presence: true, if: :scheduled?
  validates :timezone, presence: true, if: :scheduled?
  validates :meeting_link, presence: true, if: :online_meeting_required?
  validates :meeting_location, presence: true, if: :in_person_meeting_required?
  validate :meeting_channel_present_for_flexible_delivery, if: :flexible_delivery_scheduled?

  validates :rating, inclusion: { in: 1..5 }, allow_nil: true
  validates :feedback, length: { maximum: 1000 }, allow_nil: true


  before_validation :set_initial_status, on: :create
  after_create :record_initial_ledger_entries
  after_create :notify_new_booking
  after_update :notify_status_change

  def online_meeting_required?
    scheduled? && service_product.delivery_method == 'online'
  end

  def in_person_meeting_required?
    scheduled? && service_product.delivery_method == 'in_person'
  end

  def flexible_delivery_scheduled?
    scheduled? && service_product.delivery_method == 'both'
  end

  def scheduled_start_at
    return starts_at if starts_at.present?
    return unless scheduled_date.present? && scheduled_time.present?

    zone = Time.find_zone(timezone.presence) || Time.zone
    zone.parse("#{scheduled_date} #{scheduled_time}")
  rescue ArgumentError
    nil
  end

  def may_cancel?
    !completed? && !cancelled? && !refunded?
  end

  def may_refund?
    payment_paid? && !refunded? && !refund_refunded?
  end

  def may_mark_deposit_paid?(user)
    customer == user && !cancelled? && !refunded? && !deposit_confirmed?
  end

  def may_pay_deposit_with_stripe?(user)
    customer == user && !cancelled? && !refunded? && !deposit_confirmed? && deposit_amount.to_d.positive?
  end

  def may_confirm_deposit?(user)
    provider == user && deposit_reported? && !cancelled? && !refunded?
  end

  def may_mark_balance_paid?(user)
    customer == user && deposit_confirmed? && !balance_confirmed? && !cancelled? && !refunded?
  end

  def may_pay_balance_with_stripe?(user)
    customer == user && deposit_confirmed? && !balance_confirmed? && !cancelled? && !refunded? && balance_due_amount.to_d.positive?
  end

  def may_confirm_balance?(user)
    provider == user && balance_reported? && !cancelled? && !refunded?
  end

  def mark_deposit_paid!(actor:, notes: nil)
    update!(
      deposit_status: :reported,
      deposit_paid_at: Time.current,
      payment_status: :pending,
      payment_tracking_notes: notes.presence || payment_tracking_notes
    )
    record_ledger_entry!(
      entry_type: :payment_reported,
      milestone: :deposit,
      amount: deposit_amount,
      direction: :incoming,
      actor: actor,
      status: deposit_status,
      idempotency_key: "service_booking:#{id}:deposit_reported",
      metadata: { notes: notes }
    )
    add_system_message!("#{actor.display_name.presence || actor.full_name} reported the deposit payment.", actor: actor)
  end

  def confirm_deposit!(actor:, notes: nil)
    update!(
      deposit_status: :confirmed,
      deposit_confirmed_at: Time.current,
      payment_status: balance_due_amount.to_d.positive? ? :pending : :paid,
      payment_tracking_notes: notes.presence || payment_tracking_notes
    )
    record_deposit_confirmed_ledger_entry!(actor: actor, notes: notes)
    add_system_message!("#{actor.display_name.presence || actor.full_name} confirmed the deposit payment.", actor: actor)
  end

  def mark_balance_paid!(actor:, notes: nil)
    update!(
      balance_status: :reported,
      balance_paid_at: Time.current,
      payment_status: :pending,
      payment_tracking_notes: notes.presence || payment_tracking_notes
    )
    record_ledger_entry!(
      entry_type: :payment_reported,
      milestone: :balance,
      amount: balance_due_amount,
      direction: :incoming,
      actor: actor,
      status: balance_status,
      idempotency_key: "service_booking:#{id}:balance_reported",
      metadata: { notes: notes }
    )
    add_system_message!("#{actor.display_name.presence || actor.full_name} reported the balance payment.", actor: actor)
  end

  def confirm_balance!(actor:, notes: nil)
    update!(
      balance_status: :confirmed,
      balance_confirmed_at: Time.current,
      payment_status: :paid,
      payment_tracking_notes: notes.presence || payment_tracking_notes
    )
    record_balance_confirmed_ledger_entry!(actor: actor, notes: notes)
    add_system_message!("#{actor.display_name.presence || actor.full_name} confirmed the balance payment.", actor: actor)
  end

  def mark_deposit_paid_by_stripe!(checkout_session:)
    update!(
      deposit_status: :confirmed,
      deposit_paid_at: Time.current,
      deposit_confirmed_at: Time.current,
      deposit_checkout_session_id: checkout_session.id,
      deposit_payment_intent_id: checkout_session.payment_intent,
      payment_session_id: checkout_session.id,
      payment_intent_id: checkout_session.payment_intent,
      checkout_provider: "stripe",
      payment_status: balance_due_amount.to_d.positive? ? :pending : :paid
    )
    record_deposit_confirmed_ledger_entry!(
      actor: customer,
      gateway: "stripe",
      gateway_reference: checkout_session.id,
      metadata: stripe_checkout_metadata(checkout_session)
    )
    add_system_message!("Stripe confirmed the deposit payment for this booking.", actor: customer)
  end

  def mark_balance_paid_by_stripe!(checkout_session:)
    update!(
      balance_status: :confirmed,
      balance_paid_at: Time.current,
      balance_confirmed_at: Time.current,
      balance_checkout_session_id: checkout_session.id,
      balance_payment_intent_id: checkout_session.payment_intent,
      payment_session_id: checkout_session.id,
      payment_intent_id: checkout_session.payment_intent,
      checkout_provider: "stripe",
      payment_status: :paid
    )
    record_balance_confirmed_ledger_entry!(
      actor: customer,
      gateway: "stripe",
      gateway_reference: checkout_session.id,
      metadata: stripe_checkout_metadata(checkout_session)
    )
    add_system_message!("Stripe confirmed the balance payment for this booking.", actor: customer)
  end

  def mark_refund_processing!(actor:)
    update!(refund_status: :processing)
    record_ledger_entry!(
      entry_type: :refund_processing,
      milestone: :refund,
      amount: total_amount,
      direction: :outgoing,
      actor: actor,
      status: refund_status,
      gateway: checkout_provider,
      gateway_reference: payment_intent_id,
      metadata: { payment_intent_id: payment_intent_id }
    )
  end

  def mark_refund_failed!(actor:, error:, gateway_reference: nil)
    update!(refund_status: :failed)
    record_ledger_entry!(
      entry_type: :refund_failed,
      milestone: :refund,
      amount: total_amount,
      direction: :neutral,
      actor: actor,
      status: refund_status,
      gateway: checkout_provider,
      gateway_reference: gateway_reference || payment_intent_id,
      metadata: { error: error, payment_intent_id: payment_intent_id }
    )
  end

  def refund_amount_for_gateway
    amount = total_amount || subtotal_amount || service_product.price || 0

    case currency.to_s.downcase
    when "clp", "jpy", "krw"
      amount.to_i
    else
      (amount.to_d * 100).to_i
    end
  end

  def mark_refunded!(refund_id: nil, actor: nil)
    update!(
      status: :refunded,
      payment_status: :refunded,
      refund_status: :refunded,
      refund_id: refund_id,
      refunded_at: Time.current
    )
    record_refund_completed_ledger_entry!(actor: actor, refund_id: refund_id)
  end

  def record_ledger_entry!(entry_type:, milestone: nil, amount: nil, direction: :neutral, actor: nil, status: nil, gateway: nil, gateway_reference: nil, idempotency_key: nil, metadata: {})
    ServiceBookingLedgerEntry.record!(
      service_booking: self,
      actor: actor,
      entry_type: entry_type,
      milestone: milestone,
      direction: direction,
      amount: amount,
      currency: currency,
      status: status,
      gateway: gateway,
      gateway_reference: gateway_reference,
      idempotency_key: idempotency_key,
      metadata: metadata.to_h.compact,
      occurred_at: Time.current
    )
  end

  def backfill_ledger_entries!
    record_booking_created_ledger_entry!
    record_initial_payment_confirmed_ledger_entry! if payment_paid? && total_amount.to_d.positive?
    record_deposit_confirmed_ledger_entry! if deposit_confirmed?
    record_balance_confirmed_ledger_entry! if balance_confirmed?
    record_payout_calculated_ledger_entry! if artist_payout_amount.to_d.positive?
    record_refund_completed_ledger_entry!(refund_id: refund_id) if refund_refunded? || refunded?
  end

  def set_service_product_conversation
    # 3. Link conversation between buyer and seller
    buyer = customer
    seller = provider

    # Find or create a conversation for this purchase and seller
    conversation = Conversation.find_or_create_by(
      messageable: self,
      subject: "Booking ##{buyer.full_name} - #{seller.full_name}",
      status: 'active'
    )

    conversation.messages.create!(
      user: seller,
      message_type: 'text',
      body: text_default_for_start_of_conversation(service_product),
    )

    # Add buyer and seller as participants if not already present
    conversation.add_participant(buyer) unless conversation.participant?(buyer)
    conversation.add_participant(seller) unless conversation.participant?(seller)
  end

  def add_system_message!(body, actor:)
    conversation = conversations.active.first || conversations.first
    return unless conversation

    conversation.messages.create!(
      user: actor,
      message_type: "system",
      body: body
    )
  end

  private

  def record_initial_ledger_entries
    record_booking_created_ledger_entry!
    record_initial_payment_confirmed_ledger_entry! if payment_paid? && total_amount.to_d.positive?
    record_payout_calculated_ledger_entry! if artist_payout_amount.to_d.positive?
  end

  def meeting_channel_present_for_flexible_delivery
    return if meeting_link.present? || meeting_location.present?

    errors.add(:base, "Meeting link or location must be present")
  end

  def record_booking_created_ledger_entry!
    record_ledger_entry!(
      entry_type: :booking_created,
      milestone: :booking,
      amount: total_amount || subtotal_amount,
      direction: :neutral,
      status: status,
      idempotency_key: "service_booking:#{id}:booking_created",
      metadata: {
        service_product_id: service_product_id,
        product_purchase_id: product_purchase_id,
        product_purchase_item_id: product_purchase_item_id,
        payment_status: payment_status
      }
    )
  end

  def record_initial_payment_confirmed_ledger_entry!
    record_ledger_entry!(
      entry_type: :payment_confirmed,
      milestone: :booking,
      amount: total_amount,
      direction: :incoming,
      status: payment_status,
      gateway: checkout_provider,
      gateway_reference: payment_session_id || payment_intent_id,
      idempotency_key: "service_booking:#{id}:initial_payment_confirmed",
      metadata: {
        payment_intent_id: payment_intent_id,
        payment_session_id: payment_session_id,
        source: "initial_snapshot"
      }
    )
  end

  def record_deposit_confirmed_ledger_entry!(actor: nil, gateway: checkout_provider, gateway_reference: deposit_checkout_session_id, notes: nil, metadata: {})
    record_ledger_entry!(
      entry_type: :payment_confirmed,
      milestone: :deposit,
      amount: deposit_amount,
      direction: :incoming,
      actor: actor,
      status: deposit_status,
      gateway: gateway,
      gateway_reference: gateway_reference,
      idempotency_key: "service_booking:#{id}:deposit_confirmed",
      metadata: {
        notes: notes,
        checkout_session_id: deposit_checkout_session_id,
        payment_intent_id: deposit_payment_intent_id
      }.merge(metadata.to_h)
    )
  end

  def record_balance_confirmed_ledger_entry!(actor: nil, gateway: checkout_provider, gateway_reference: balance_checkout_session_id, notes: nil, metadata: {})
    record_ledger_entry!(
      entry_type: :payment_confirmed,
      milestone: :balance,
      amount: balance_due_amount,
      direction: :incoming,
      actor: actor,
      status: balance_status,
      gateway: gateway,
      gateway_reference: gateway_reference,
      idempotency_key: "service_booking:#{id}:balance_confirmed",
      metadata: {
        notes: notes,
        checkout_session_id: balance_checkout_session_id,
        payment_intent_id: balance_payment_intent_id
      }.merge(metadata.to_h)
    )
  end

  def record_payout_calculated_ledger_entry!
    record_ledger_entry!(
      entry_type: :payout_calculated,
      milestone: :payout,
      amount: artist_payout_amount,
      direction: :outgoing,
      status: "calculated",
      idempotency_key: "service_booking:#{id}:payout_calculated",
      metadata: {
        platform_fee_rate: platform_fee_rate,
        platform_fee_amount: platform_fee_amount
      }
    )
  end

  def record_refund_completed_ledger_entry!(actor: nil, refund_id: nil)
    record_ledger_entry!(
      entry_type: :refund_completed,
      milestone: :refund,
      amount: total_amount,
      direction: :outgoing,
      actor: actor,
      status: refund_status,
      gateway: checkout_provider,
      gateway_reference: refund_id || self.refund_id,
      idempotency_key: "service_booking:#{id}:refund_completed",
      metadata: {
        refund_id: refund_id || self.refund_id,
        payment_intent_id: payment_intent_id
      }
    )
  end

  def stripe_checkout_metadata(checkout_session)
    {
      checkout_session_id: checkout_session.id,
      payment_intent_id: checkout_session.payment_intent,
      payment_status: checkout_session.payment_status
    }
  end

  def text_default_for_start_of_conversation(service_product)
    buyer = customer
    seller = provider
    %Q(
        Hola #{customer.full_name},
        <br/>
        Gracias por solicitar el servicio con #{provider.full_name}.
        <br/>
        Este es un mensaje automático para informarte que tu solicitud ha sido enviada.
        Aún no hay una fecha confirmada. Debes coordinar el día y la hora del servicio.
        <br/>  
        Aquí los detalles de lo solicitado:
        <br/>
        Servicio: #{service_product.title}

        <br/>
        Una vez que acuerden la fecha, te enviaremos una confirmación oficial.

        <br/>
        #{service_product.post_purchase_instructions ? 
         "#{provider.full_name} dice: <br/>#{service_product.post_purchase_instructions}"
        : ""}
    ).html_safe
  end

  def set_initial_status
    self.status ||= :pending_confirmation
  end

  def notify_new_booking
    ServiceBookingMailer.new_booking_notification(self).deliver_later
  end

  def notify_status_change
    if saved_change_to_status?
      case status.to_sym
      when :confirmed
        ServiceBookingMailer.booking_confirmed_notification(self).deliver_later
      when :scheduled
        ServiceBookingMailer.booking_scheduled_notification(self).deliver_later
      when :completed
        ServiceBookingMailer.service_completed_notification(self).deliver_later
      when :cancelled
        notify_cancellation
      end
    end
  end

  def notify_cancellation
    # Notify both customer and provider about cancellation
    ServiceBookingMailer.booking_cancelled_notification(self, customer).deliver_later
    ServiceBookingMailer.booking_cancelled_notification(self, provider).deliver_later
  end

end
