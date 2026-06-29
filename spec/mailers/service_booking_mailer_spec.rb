require "rails_helper"

RSpec.describe ServiceBookingMailer, type: :mailer do
  let(:customer) { create(:user, username: "booker", email: "booker@example.com") }
  let(:provider) { create(:user, username: "dj", email: "dj@example.com") }
  let(:service_product) { create(:service_product, user: provider, title: "DJ set", delivery_method: "in_person") }
  let(:booking) do
    create(
      :service_booking,
      service_product: service_product,
      customer: customer,
      provider: provider,
      status: "cancelled",
      cancelled_by: provider,
      cancellation_reason: "El evento cambió de fecha"
    )
  end

  before do
    allow_any_instance_of(described_class).to receive(:default_email_account).and_return("no-reply@example.com")
  end

  describe "#booking_cancelled_notification" do
    it "notifies the recipient with cancellation details" do
      I18n.with_locale(:es) do
        mail = described_class.booking_cancelled_notification(booking, customer)
        html = mail.html_part.body.decoded
        text = mail.text_part.body.decoded

        expect(mail.to).to eq(["booker@example.com"])
        expect(mail.subject).to include("Reserva de DJ set cancelada")
        expect(html).to include("El evento cambió de fecha")
        expect(html).to include("Ver reserva")
        expect(text).to include(Rails.application.routes.url_helpers.service_booking_url(booking))
      end
    end
  end

  describe "#deposit_payment_reminder" do
    it "notifies the customer with the deposit amount and booking link" do
      deposit_booking = create(
        :service_booking,
        service_product: service_product,
        customer: customer,
        provider: provider,
        status: "confirmed",
        payment_status: "pending",
        deposit_amount: 50_000,
        currency: "clp"
      )

      I18n.with_locale(:es) do
        mail = described_class.deposit_payment_reminder(deposit_booking)
        html = mail.html_part.body.decoded

        expect(mail.to).to eq(["booker@example.com"])
        expect(mail.subject).to include("Adelanto pendiente")
        expect(html).to include("Pagar adelanto")
        expect(html).to include("CLP")
      end
    end
  end

  describe "#balance_payment_reminder" do
    it "notifies the customer with the balance amount" do
      balance_booking = create(
        :service_booking,
        service_product: service_product,
        customer: customer,
        provider: provider,
        status: "scheduled",
        payment_status: "pending",
        deposit_status: "confirmed",
        balance_status: "unpaid",
        balance_due_amount: 75_000,
        currency: "clp",
        scheduled_date: 2.days.from_now.to_date.iso8601,
        scheduled_time: "22:00",
        timezone: "UTC",
        meeting_location: "Club Rau"
      )

      I18n.with_locale(:es) do
        mail = described_class.balance_payment_reminder(balance_booking)
        html = mail.html_part.body.decoded

        expect(mail.to).to eq(["booker@example.com"])
        expect(mail.subject).to include("Saldo pendiente")
        expect(html).to include("Pagar saldo")
      end
    end
  end

  describe "#provider_confirmation_reminder" do
    it "notifies the provider" do
      pending_booking = create(
        :service_booking,
        service_product: service_product,
        customer: customer,
        provider: provider,
        status: "pending_confirmation"
      )

      I18n.with_locale(:es) do
        mail = described_class.provider_confirmation_reminder(pending_booking)

        expect(mail.to).to eq(["dj@example.com"])
        expect(mail.subject).to include("pendiente de confirmar")
      end
    end
  end

  describe "#reminder_notification" do
    it "notifies a participant about an upcoming booking" do
      scheduled_booking = create(
        :service_booking,
        service_product: service_product,
        customer: customer,
        provider: provider,
        status: "scheduled",
        scheduled_date: 12.hours.from_now.to_date.iso8601,
        scheduled_time: "22:00",
        timezone: "UTC",
        meeting_location: "Club Rau"
      )

      I18n.with_locale(:es) do
        mail = described_class.reminder_notification(scheduled_booking, provider)
        html = mail.html_part.body.decoded

        expect(mail.to).to eq(["dj@example.com"])
        expect(mail.subject).to include("Recordatorio")
        expect(html).to include("Club Rau")
      end
    end
  end
end
