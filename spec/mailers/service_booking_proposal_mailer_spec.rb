require "rails_helper"

RSpec.describe ServiceBookingProposalMailer, type: :mailer do
  include ActiveJob::TestHelper

  let(:booker) { create(:user, username: "booker", email: "booker@example.com", first_name: "Booker", last_name: "User") }
  let(:artist) { create(:user, username: "artist", email: "artist@example.com", first_name: "Artist", last_name: "User") }
  let(:service_product) { create(:service_product, user: artist, title: "DJ set") }
  let(:proposal) do
    create(
      :service_booking_proposal,
      booker: booker,
      service_product: service_product,
      artist: artist,
      event_name: "Club Night",
      proposed_amount: 600_000,
      currency: "clp"
    )
  end

  before do
    allow_any_instance_of(described_class).to receive(:default_email_account).and_return("no-reply@example.com")
  end

  around do |example|
    previous_adapter = ActiveJob::Base.queue_adapter
    ActiveJob::Base.queue_adapter = :test
    clear_enqueued_jobs
    example.run
  ensure
    clear_enqueued_jobs
    ActiveJob::Base.queue_adapter = previous_adapter
  end

  describe "#proposal_created" do
    it "notifies the artist with proposal details" do
      I18n.with_locale(:es) do
        mail = described_class.proposal_created(proposal)
        html = mail.html_part.body.decoded
        text = mail.text_part.body.decoded

        expect(mail.to).to eq(["artist@example.com"])
        expect(mail.subject).to include("Nueva propuesta de show")
        expect(html).to include("Club Night")
        expect(html).to include("DJ set")
        expect(html).to include("Ver propuesta")
        expect(text).to include(Rails.application.routes.url_helpers.service_booking_proposal_url(proposal))
      end
    end
  end

  describe "#counterproposal_received" do
    it "notifies the booker when the artist counters" do
      I18n.with_locale(:es) do
        mail = described_class.counterproposal_received(proposal, artist)
        html = mail.html_part.body.decoded

        expect(mail.to).to eq(["booker@example.com"])
        expect(mail.subject).to include("Contrapropuesta")
        expect(html).to include("Condiciones actualizadas")
        expect(html).to include("Club Night")
      end
    end
  end

  describe "#proposal_accepted" do
    it "notifies the booker when the artist accepts and includes the booking link" do
      proposal.accept!(actor: artist)

      I18n.with_locale(:es) do
        mail = described_class.proposal_accepted(proposal.reload, artist)
        html = mail.html_part.body.decoded
        text = mail.text_part.body.decoded

        expect(mail.to).to eq(["booker@example.com"])
        expect(mail.subject).to include("aceptó la propuesta")
        expect(html).to include("El contrato quedó firmado")
        expect(html).to include("Ver booking")
        expect(text).to include(Rails.application.routes.url_helpers.service_booking_url(proposal.service_booking))
      end
    end
  end

  describe "#proposal_rejected" do
    it "notifies the booker when the artist rejects" do
      I18n.with_locale(:es) do
        mail = described_class.proposal_rejected(proposal, artist)
        html = mail.html_part.body.decoded

        expect(mail.to).to eq(["booker@example.com"])
        expect(mail.subject).to include("rechazó la propuesta")
        expect(html).to include("Esta propuesta quedó cerrada")
      end
    end
  end

  describe "#proposal_cancelled" do
    it "notifies the artist when the booker cancels" do
      I18n.with_locale(:es) do
        mail = described_class.proposal_cancelled(proposal, booker)
        html = mail.html_part.body.decoded

        expect(mail.to).to eq(["artist@example.com"])
        expect(mail.subject).to include("canceló la propuesta")
        expect(html).to include("No se creó un booking")
      end
    end
  end
end
