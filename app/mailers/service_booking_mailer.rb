class ServiceBookingMailer < ApplicationMailer
  def new_booking_notification(service_booking)
    @service_booking = service_booking
    @provider = service_booking.provider
    @customer = service_booking.customer
    @service = service_booking.service_product

    mail(
      to: @provider.email,
      subject: default_i18n_subject(
        service: @service.title,
        customer: @customer.username
      )
    )
  end

  def booking_confirmed_notification(service_booking)
    @service_booking = service_booking
    @provider = service_booking.provider
    @customer = service_booking.customer
    @service = service_booking.service_product

    mail(
      to: @customer.email,
      subject: default_i18n_subject(
        service: @service.title,
        provider: @provider.username
      )
    )
  end

  def booking_scheduled_notification(service_booking)
    @service_booking = service_booking
    @provider = service_booking.provider
    @customer = service_booking.customer
    @service = service_booking.service_product

    mail(
      to: @customer.email,
      subject: default_i18n_subject(
        service: @service.title,
        provider: @provider.username
      )
    )
  end

  def service_completed_notification(service_booking)
    @service_booking = service_booking
    @provider = service_booking.provider
    @customer = service_booking.customer
    @service = service_booking.service_product

    mail(
      to: @customer.email,
      subject: default_i18n_subject(
        service: @service.title
      )
    )
  end

  def booking_cancelled_notification(service_booking, recipient)
    @service_booking = service_booking
    @provider = service_booking.provider
    @customer = service_booking.customer
    @service = service_booking.service_product
    @recipient = recipient
    @cancelled_by = service_booking.cancelled_by
    @cancelled_by_name = display_name(@cancelled_by) || 'system'
    @booking_url = service_booking_url(service_booking)

    mail(
      to: recipient.email,
      subject: default_i18n_subject(
        service: @service.title,
        cancelled_by: @cancelled_by_name
      )
    )
  end

  def provider_confirmation_reminder(service_booking)
    assign_booking(service_booking)

    mail(
      to: @provider.email,
      subject: default_i18n_subject(service: @service.title)
    )
  end

  def deposit_payment_reminder(service_booking)
    assign_booking(service_booking)
    @amount = formatted_booking_amount(@service_booking.deposit_amount, @service_booking.currency)
    @booking_url = service_booking_url(service_booking)

    mail(
      to: @customer.email,
      subject: default_i18n_subject(service: @service.title, amount: @amount)
    )
  end

  def balance_payment_reminder(service_booking)
    assign_booking(service_booking)
    @amount = formatted_booking_amount(@service_booking.balance_due_amount, @service_booking.currency)
    @booking_url = service_booking_url(service_booking)

    mail(
      to: @customer.email,
      subject: default_i18n_subject(service: @service.title, amount: @amount)
    )
  end

  def reminder_notification(service_booking, recipient)
    assign_booking(service_booking)
    @recipient = recipient

    mail(
      to: recipient.email,
      subject: default_i18n_subject(
        service: @service.title,
        time: @scheduled_at ? I18n.l(@scheduled_at, format: :long) : @service_booking.scheduled_date
      )
    )
  end

  private

  def assign_booking(service_booking)
    @service_booking = service_booking
    @provider = service_booking.provider
    @customer = service_booking.customer
    @service = service_booking.service_product
    @booking_url = service_booking_url(service_booking)
    @scheduled_at = service_booking.scheduled_start_at
  end

  def display_name(user)
    return if user.blank?

    user.display_name.presence || user.full_name.presence || user.username
  end

  def formatted_booking_amount(amount, currency)
    return "" if amount.blank?

    currency_code = currency.to_s.upcase.presence || "USD"
    numeric_amount = amount.to_d
    precision = ApplicationHelper::ZERO_DECIMAL_CURRENCIES.include?(currency_code.downcase) ? 0 : (numeric_amount.frac.zero? ? 0 : 2)

    ActionController::Base.helpers.number_to_currency(
      numeric_amount,
      unit: "#{currency_code} ",
      precision: precision
    )
  end
end
