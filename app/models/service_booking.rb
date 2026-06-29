class ServiceBooking < ApplicationRecord
  has_many :conversations, as: :messageable
  belongs_to :service_product, class_name: 'Products::ServiceProduct'
  belongs_to :customer, class_name: 'User'
  belongs_to :provider, class_name: 'User'
  belongs_to :cancelled_by, class_name: 'User', optional: true
  belongs_to :product_purchase, optional: true
  belongs_to :product_purchase_item, optional: true
  has_one :service_booking_proposal, dependent: :nullify

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
    reported: 'reported',
    confirmed: 'confirmed'
  }, prefix: :deposit

  enum :balance_status, {
    unpaid: 'unpaid',
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

  validates :rating, inclusion: { in: 1..5 }, allow_nil: true
  validates :feedback, length: { maximum: 1000 }, allow_nil: true


  before_validation :set_initial_status, on: :create
  after_create :notify_new_booking
  after_update :notify_status_change

  def online_meeting_required?
    scheduled? && ['online', 'both'].include?(service_product.delivery_method)
  end

  def in_person_meeting_required?
    scheduled? && ['in_person', 'both'].include?(service_product.delivery_method)
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

  def may_confirm_deposit?(user)
    provider == user && deposit_reported? && !cancelled? && !refunded?
  end

  def may_mark_balance_paid?(user)
    customer == user && deposit_confirmed? && !balance_confirmed? && !cancelled? && !refunded?
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
    add_system_message!("#{actor.display_name.presence || actor.full_name} reported the deposit payment.", actor: actor)
  end

  def confirm_deposit!(actor:, notes: nil)
    update!(
      deposit_status: :confirmed,
      deposit_confirmed_at: Time.current,
      payment_status: balance_due_amount.to_d.positive? ? :pending : :paid,
      payment_tracking_notes: notes.presence || payment_tracking_notes
    )
    add_system_message!("#{actor.display_name.presence || actor.full_name} confirmed the deposit payment.", actor: actor)
  end

  def mark_balance_paid!(actor:, notes: nil)
    update!(
      balance_status: :reported,
      balance_paid_at: Time.current,
      payment_status: :pending,
      payment_tracking_notes: notes.presence || payment_tracking_notes
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
    add_system_message!("#{actor.display_name.presence || actor.full_name} confirmed the balance payment.", actor: actor)
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

  def mark_refunded!(refund_id: nil)
    update!(
      status: :refunded,
      payment_status: :refunded,
      refund_status: :refunded,
      refund_id: refund_id,
      refunded_at: Time.current
    )
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
        schedule_reminder_notification
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

  def schedule_reminder_notification
    return unless scheduled_date && scheduled_time

    scheduled_datetime = DateTime.parse("#{scheduled_date} #{scheduled_time}")
    reminder_time = scheduled_datetime - 24.hours

    if reminder_time > Time.current
      ServiceBookingMailer.reminder_notification(self, customer)
        .deliver_later(wait_until: reminder_time)
      ServiceBookingMailer.reminder_notification(self, provider)
        .deliver_later(wait_until: reminder_time)
    end
  end

end
