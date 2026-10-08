require "rails_helper"

RSpec.describe "Product Stripe webhooks", type: :request do
  include ActiveJob::TestHelper

  let(:buyer) { create(:user) }
  let(:seller) { create(:user, stripe_account_id: "acct_seller") }
  let(:product) { create(:product, user: seller, price: 100, stock_quantity: 10) }
  let(:cart) { ProductCart.create!(user: buyer) }
  let(:purchase) do
    create(:product_purchase, user: buyer, status: :pending, stripe_session_id: "cs_product")
  end
  let(:session) do
    Stripe::Checkout::Session.construct_from(
      id: "cs_product", payment_status: "paid", amount_total: 21_600, currency: "usd",
      payment_intent: "pi_product", metadata: { source_type: "product", purchase_id: purchase.id, cart_id: cart.id },
      shipping_cost: nil, shipping_details: nil, customer_details: { phone: "123456789" }
    )
  end
  let(:intent) do
    Stripe::PaymentIntent.construct_from(id: "pi_product", status: "succeeded")
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
    cart.add_product(product, 2)
    allow(Stripe::Webhook).to receive(:construct_event) { |payload, *_args| Stripe::Event.construct_from(JSON.parse(payload)) }
    allow(Stripe::Checkout::Session).to receive(:retrieve).with("cs_product").and_return(session)
    allow(Stripe::PaymentIntent).to receive(:retrieve).and_return(intent)
    allow(Stripe::Transfer).to receive(:list).and_return(Stripe::StripeObject.construct_from(data: []))
    allow(Stripe::Transfer).to receive(:create).and_return(Stripe::Transfer.construct_from(id: "tr_product"))
  end

  def post_event(type, object = session.to_h)
    post "/webhooks/stripe", params: {
      id: "evt_product", object: "event", type: type, data: { object: object }
    }.to_json, headers: { "CONTENT_TYPE" => "application/json", "Stripe-Signature" => "test" }
  end

  it "fulfills the purchase once without making any subsequent seller transfer" do
    post_event("checkout.session.completed")
    post_event("checkout.session.completed")

    expect(response).to have_http_status(:ok)
    expect(purchase.reload).to have_attributes(status: "completed", total_amount: 216)
    expect(purchase.product_purchase_items.count).to eq(1)
    expect(product.reload.stock_quantity).to eq(8)
    expect(Stripe::Transfer).not_to have_received(:create)
    expect(Stripe::Transfer).not_to have_received(:list)
  end

  it "keeps an unpaid checkout pending until the asynchronous payment succeeds" do
    session.payment_status = "unpaid"

    expect { post_event("checkout.session.completed") }.not_to have_enqueued_job(WebhookWorkerJob)
    expect(purchase.reload).to be_pending
    expect(product.reload.stock_quantity).to eq(10)

    session.payment_status = "paid"
    expect { post_event("checkout.session.async_payment_succeeded") }.to have_enqueued_job(WebhookWorkerJob).with(purchase.id)
    expect(purchase.reload).to be_completed
    expect(product.reload.stock_quantity).to eq(8)
  end

  it "fulfills pickup orders without an address or shipping charge and preserves the choice" do
    product.update!(allow_pickup: true)
    create(:product_shipping, product: product, country: "US", base_cost: 5, additional_cost: 2)
    purchase.update!(delivery_method: "local_pickup")

    post_event("checkout.session.completed")

    expect(response).to have_http_status(:ok)
    expect(purchase.reload).to have_attributes(status: "completed", delivery_method: "local_pickup",
      shipping_address: nil, shipping_cost: 0)
    expect(purchase.product_purchase_items.first.shipping_cost).to eq(0)
    expect(product.reload.stock_quantity).to eq(8)
  end

  it "marks a failed asynchronous payment without paying the seller" do
    expect { post_event("checkout.session.async_payment_failed") }.not_to have_enqueued_job(WebhookWorkerJob)

    expect(purchase.reload).to be_failed
    expect(product.reload.stock_quantity).to eq(10)
  end

  it "does not initiate a transfer when Stripe announces the processing fee" do
    purchase.update!(status: :completed, payment_intent_id: "pi_product")
    object = { id: "ch_product", metadata: { source_type: "product", processing_fee_payer: "seller", purchase_id: purchase.id } }

    post_event("charge.updated", object)

    expect(response).to have_http_status(:ok)
    expect(Stripe::Transfer).not_to have_received(:create)
  end

  it "ignores ticket charges when Stripe announces their processing fee" do
    object = { id: "ch_event", metadata: { source_type: "event" } }

    post_event("charge.updated", object)

    expect(Stripe::Transfer).not_to have_received(:create)
  end

  it "does not create a second transfer for legacy product checkouts" do
    post_event("checkout.session.completed")

    expect(Stripe::Transfer).not_to have_received(:create)
    expect(purchase.reload).to be_completed
  end
end
