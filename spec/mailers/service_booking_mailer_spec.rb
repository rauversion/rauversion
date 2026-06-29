require "rails_helper"

RSpec.describe ServiceBookingMailer, type: :mailer do
  let(:customer) { create(:user, username: "booker", email: "booker@example.com") }
  let(:provider) { create(:user, username: "dj", email: "dj@example.com") }
  let(:service_product) { create(:service_product, user: provider, title: "DJ set") }
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
end
