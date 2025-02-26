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

    mail(
      to: recipient.email,
      subject: default_i18n_subject(
        service: @service.title,
        cancelled_by: @service_booking.cancelled_by&.username || 'system'
      )
    )
  end

  def reminder_notification(service_booking, recipient)
    @service_booking = service_booking
    @provider = service_booking.provider
    @customer = service_booking.customer
    @service = service_booking.service_product
    @recipient = recipient

    mail(
      to: recipient.email,
      subject: default_i18n_subject(
        service: @service.title,
        time: I18n.l(@service_booking.scheduled_date.to_date, format: :long)
      )
    )
  end
end
