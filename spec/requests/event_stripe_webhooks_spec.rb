require "rails_helper"

RSpec.describe "Event Stripe webhooks", type: :request do
  include ActiveJob::TestHelper

  let(:buyer) { create(:user) }
  let(:organizer) { create(:user, stripe_account_id: "acct_event_seller") }
  let(:event) { create(:event, user: organizer, ticket_currency: "usd") }
  let(:ticket) { create(:event_ticket, event: event, price: 20, qty: 10) }
  let(:purchase) do
    create(:purchase, user: buyer, purchasable: event, state: "pending", checkout_type: "stripe", checkout_id: "cs_event")
  end
  let!(:item) { create(:purchased_item, purchase: purchase, purchased_item: ticket, price: 20, currency: "usd") }
  let(:session) do
    Stripe::Checkout::Session.construct_from(
      id: "cs_event", payment_status: "paid", amount_total: 2_160, amount_subtotal: 2_160,
      currency: "usd", payment_intent: "pi_event",
      total_details: { amount_tax: 0, amount_discount: 0, amount_shipping: 0 },
      metadata: {
        source_type: "event", purchase_id: purchase.id.to_s, processing_fee_payer: "seller",
        processing_fee_model: "estimated", service_fee_amount: "160", estimated_processing_fee_amount: "93",
        processing_fee_base_amount: "2160", processing_fee_base_model: "before_exclusive_tax",
        application_fee_amount: "253", ticket_total_amount: "2000"
      }
    )
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

  before do
    allow(Stripe::Webhook).to receive(:construct_event) { |payload, *_args| Stripe::Event.construct_from(JSON.parse(payload)) }
    allow(Stripe::Transfer).to receive(:create)
  end

  def post_event(type, object = session.to_h)
    post "/webhooks/stripe", params: {
      id: "evt_event", object: "event", type: type, data: { object: object }
    }.to_json, headers: { "CONTENT_TYPE" => "application/json", "Stripe-Signature" => "test" }
  end

  it "confirms tickets once without making a later seller transfer" do
    post_event("checkout.session.completed")
    post_event("checkout.session.completed")
    post_event("checkout.session.async_payment_succeeded")

    expect(response).to have_http_status(:ok)
    expect(purchase.reload).to be_paid
    expect(item.reload).to be_paid
    expect(enqueued_jobs.count { |job| job[:job] == ProcessPurchaseJob }).to eq(1)
    expect(Stripe::Transfer).not_to have_received(:create)
  end

  it "decrements stock once when Stripe redelivers the completed event" do
    perform_enqueued_jobs(only: ProcessPurchaseJob) do
      post_event("checkout.session.completed")
      post_event("checkout.session.completed")
    end

    expect(ticket.reload.qty).to eq(9)
    expect(purchase.reload).to be_paid
  end

  it "records the original fee metadata and the final paid total including taxes" do
    session.amount_total = 2_376
    session.total_details.amount_tax = 216

    post_event("checkout.session.completed")

    expect(purchase.reload.payment_metadata).to include(
      "currency" => "usd", "amount_unit" => "minor", "payment_intent_id" => "pi_event",
      "processing_fee_payer" => "seller", "processing_fee_model" => "estimated",
      "ticket_total_amount" => 2_000, "service_fee_amount" => 160,
      "estimated_processing_fee_amount" => 93, "application_fee_amount" => 253,
      "processing_fee_base_amount" => 2_160, "processing_fee_base_model" => "before_exclusive_tax",
      "amount_total" => 2_376, "amount_subtotal" => 2_160, "amount_tax" => 216,
      "amount_discount" => 0, "amount_shipping" => 0
    )
  end

  it "preserves the checkout fee snapshot when event fees or Stripe metadata change" do
    purchase.update!(payment_metadata: {
      "service_fee_percentage" => 8, "service_fee_amount" => 160,
      "estimated_processing_fee_amount" => 93, "application_fee_amount" => 253,
      "connected_account_id" => "acct_event_seller", "ticket_tax_behavior" => "inclusive"
    })
    event.update!(custom_fee: 20, ticket_tax_behavior: "exclusive")
    session.metadata.service_fee_amount = "400"
    session.metadata.estimated_processing_fee_amount = "200"
    session.metadata.application_fee_amount = "600"
    session.metadata.ticket_tax_behavior = "exclusive"

    post_event("checkout.session.completed")
    post_event("checkout.session.async_payment_succeeded")

    expect(purchase.reload.payment_metadata).to include(
      "service_fee_percentage" => 8, "service_fee_amount" => 160,
      "estimated_processing_fee_amount" => 93, "application_fee_amount" => 253,
      "connected_account_id" => "acct_event_seller", "amount_total" => 2_160,
      "ticket_tax_behavior" => "inclusive"
    )
    expect(enqueued_jobs.count { |job| job[:job] == ProcessPurchaseJob }).to eq(1)
  end

  it "keeps CLP metadata in pesos and accepts an expanded PaymentIntent" do
    session.currency = "clp"
    session.amount_subtotal = 10_800
    session.amount_total = 10_800
    session.payment_intent = Stripe::PaymentIntent.construct_from(id: "pi_event_clp")
    session.metadata.service_fee_amount = "800"
    session.metadata.estimated_processing_fee_amount = "313"
    session.metadata.application_fee_amount = "1113"
    session.metadata.processing_fee_base_amount = "10800"
    session.metadata.ticket_total_amount = "10000"

    post_event("checkout.session.completed")

    expect(purchase.reload.payment_metadata).to include(
      "currency" => "clp", "amount_unit" => "minor", "payment_intent_id" => "pi_event_clp",
      "ticket_total_amount" => 10_000, "service_fee_amount" => 800,
      "estimated_processing_fee_amount" => 313, "application_fee_amount" => 1_113,
      "amount_total" => 10_800
    )
  end

  it "waits for a delayed payment to succeed before confirming tickets" do
    session.payment_status = "unpaid"

    expect { post_event("checkout.session.completed") }.not_to have_enqueued_job(ProcessPurchaseJob)
    expect(purchase.reload).to be_pending
    expect(purchase.payment_metadata).not_to have_key("amount_total")
    expect(item.reload).to be_pending
    expect(ticket.reload.qty).to eq(10)

    session.payment_status = "paid"

    expect { post_event("checkout.session.async_payment_succeeded") }.to have_enqueued_job(ProcessPurchaseJob).with(purchase.id)
    expect(purchase.reload).to be_paid
    expect(purchase.payment_metadata).to include("amount_total" => 2_160, "application_fee_amount" => 253)
    expect(item.reload).to be_paid
  end

  it "does not grant tickets or send money when a delayed payment fails" do
    session.payment_status = "unpaid"

    expect { post_event("checkout.session.async_payment_failed") }.not_to have_enqueued_job(ProcessPurchaseJob)

    expect(response).to have_http_status(:ok)
    expect(purchase.reload).to be_pending
    expect(item.reload).to be_pending
    expect(ticket.reload.qty).to eq(10)
    expect(Stripe::Transfer).not_to have_received(:create)
  end

  it "keeps legacy ticket sessions valid without requiring the new fee metadata" do
    session.metadata = Stripe::StripeObject.construct_from(source_type: "event")

    post_event("checkout.session.completed")

    expect(purchase.reload).to be_paid
    expect(purchase.payment_metadata).to include("amount_total" => 2_160, "currency" => "usd")
    expect(purchase.payment_metadata).not_to have_key("estimated_processing_fee_amount")
    expect(Stripe::Transfer).not_to have_received(:create)
  end
end
