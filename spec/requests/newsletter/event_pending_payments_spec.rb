require "rails_helper"

RSpec.describe "Newsletter audiences with pending event payments", type: :request do
  let(:organizer) { create(:user, confirmed_at: Time.current, can_send_newsletter: true) }
  let(:event) { create(:event, user: organizer) }
  let(:ticket) { create(:event_ticket, event: event) }

  before { sign_in organizer }

  it "uses only unpaid recipients for the selected event and checks again at send time" do
    other_event = create(:event, user: organizer)
    other_ticket = create(:event_ticket, event: other_event)
    vip_ticket = create(:event_ticket, event: event, title: "VIP")
    pending_guest = create(:user)
    already_paid = create(:user)
    paid_as_guest = create(:user, email: "guest@example.com")
    paid_after_preview = create(:user)

    buy_ticket(pending_guest, ticket, state: "pending", guest_email: pending_guest.email)
    buy_ticket(pending_guest, vip_ticket, state: "pending", guest_email: pending_guest.email)
    buy_ticket(pending_guest, other_ticket, state: "paid")
    buy_ticket(already_paid, ticket, state: "pending")
    buy_ticket(already_paid, vip_ticket, state: "paid")
    buy_ticket(paid_as_guest, ticket, state: "pending")
    # The account email changed after guest checkout; the purchase retains the guest email.
    buy_ticket(create(:user), vip_ticket, state: "paid", guest_email: " GUEST@EXAMPLE.COM ")
    buy_ticket(paid_after_preview, ticket, state: "pending")

    source = { source_type: "event_pending_payments", source_settings: { event_id: event.id } }

    post preview_newsletter_audiences_path(format: :json), params: { sources: [source] }, as: :json

    expect(response).to have_http_status(:ok)
    recipients = response.parsed_body.dig("preview", "recipients")
    expect(recipients.pluck("email")).to contain_exactly(pending_guest.email, paid_after_preview.email)

    post newsletter_audiences_path(format: :json),
      params: { audience: { name: "Pagos pendientes", sources: [source] } }, as: :json

    expect(response).to have_http_status(:created)
    audience_id = response.parsed_body.dig("audience", "id")
    template = create(:email_template, user: organizer)
    broadcast = organizer.newsletter_broadcasts.create!(name: "Recordatorio")
    buy_ticket(paid_after_preview, ticket, state: "paid")

    expect(Newsletter::BroadcastDeliveryJob).to receive(:perform_later).with(broadcast.id)

    post send_now_newsletter_broadcast_path(broadcast, format: :json),
      params: {
        broadcast: {
          audience_id: audience_id,
          email_template_id: template.id,
          subject_template: "Tu entrada",
          html_template: "<p>Tu entrada</p>",
        },
      }, as: :json

    expect(response).to have_http_status(:ok)
    expect(broadcast.recipients.pluck(:email)).to eq([pending_guest.email])
  end

  it "does not expose pending buyers for an event the organizer cannot access" do
    other_ticket = create(:event_ticket)
    buy_ticket(create(:user), other_ticket, state: "pending")

    post preview_newsletter_audiences_path(format: :json),
      params: { sources: [{ source_type: "event_pending_payments", source_settings: { event_id: other_ticket.event_id } }] },
      as: :json

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("preview", "recipients")).to be_empty
    expect(response.parsed_body.dig("preview", "warnings")).to include(a_string_matching(/No tienes permisos/))
  end

  def buy_ticket(buyer, ticket, state:, guest_email: nil)
    purchase = create(:purchase, user: buyer, purchasable: ticket.event, state: state, guest_email: guest_email)
    create(:purchased_item, purchase: purchase, purchased_item: ticket, state: state)
  end
end
