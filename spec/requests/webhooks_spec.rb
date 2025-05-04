require "rails_helper"

RSpec.describe "Webhooks", type: :request do

  include FactoryBot::Syntax::Methods
  let(:endpoint) { "/webhooks/stripe" }
  let(:payload) do
    {
      id: "evt_test_webhook",
      object: "event",
      type: event_type,
      data: {
        object: {
          id: "pi_test",
          object: "payment_intent"
        }
      }
    }.to_json
  end
  let(:sig_header) { "t=12345,v1=fake_signature" }

  describe "POST /webhooks/stripe" do
    context "with a valid payment_intent.succeeded event" do
      let(:event_type) { "payment_intent.succeeded" }
      let(:stripe_event) do
        double(
          "Stripe::Event",
          type: event_type,
          data: OpenStruct.new(object: { id: "pi_test" })
        )
      end

      it "returns success" do
        allow(Stripe::Webhook).to receive(:construct_event).and_return(stripe_event)
        post endpoint, params: payload, headers: { "Stripe-Signature" => sig_header, "CONTENT_TYPE" => "application/json" }
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to eq({ "message" => "success" })
      end
    end

    context "with a valid checkout.session.completed event" do
      let(:event_type) { "checkout.session.completed" }
      let(:stripe_event) do
        double(
          "Stripe::Event",
          type: event_type,
          data: OpenStruct.new(object: { id: "cs_test", metadata: { "source_type" => "product", "purchase_id" => 1 } })
        )
      end

      it "returns success" do
        allow(Stripe::Webhook).to receive(:construct_event).and_return(stripe_event)
        allow_any_instance_of(WebhooksController).to receive(:confirm_stripe_purchase)
        post endpoint, params: payload, headers: { "Stripe-Signature" => sig_header, "CONTENT_TYPE" => "application/json" }
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to eq({ "message" => "success" })
      end
    end

    context "with an unhandled event type" do
      let(:event_type) { "unknown.event" }
      let(:stripe_event) do
        double(
          "Stripe::Event",
          type: event_type,
          data: OpenStruct.new(object: { id: "obj_test" })
        )
      end

      it "returns success" do
        allow(Stripe::Webhook).to receive(:construct_event).and_return(stripe_event)
        post endpoint, params: payload, headers: { "Stripe-Signature" => sig_header, "CONTENT_TYPE" => "application/json" }
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to eq({ "message" => "success" })
      end
    end

    context "with invalid signature" do
      let(:event_type) { "payment_intent.succeeded" }
      before do
        allow(Stripe::Webhook).to receive(:construct_event).and_raise(Stripe::SignatureVerificationError.new("Invalid signature", "sig_header"))
      end

      it "returns bad request" do
        post endpoint, params: payload, headers: { "Stripe-Signature" => sig_header, "CONTENT_TYPE" => "application/json" }
        expect(response).to have_http_status(:bad_request)
        expect(JSON.parse(response.body)).to have_key("error")
      end
    end

    context "with a real product purchase flow" do
      let(:product_user) { create(:user) }
      let(:event_type) { "checkout.session.completed" }
      let(:product) { create(:product, stock_quantity: 100, quantity: 10, price: 100, user: product_user) }
      let!(:shipping) { create(:product_shipping, product: product, country: "US", base_cost: 5, additional_cost: 100) }
      let(:cart) { ProductCart.create!(user: user) }
      let(:cart_item) { cart.product_cart_items.create!(product: product, quantity: 2) }
      let(:user) { create(:user) }
      let(:purchase) { create(:product_purchase, user: user, status: :pending, stripe_session_id: "sess_123") }
      let(:stripe_event) do
        double(
          "Stripe::Event",
          type: event_type,
          data: OpenStruct.new(
            object: OpenStruct.new(
              id: "sess_123",
              metadata: OpenStruct.new(source_type: "product", purchase_id: purchase.id)
            )
          )
        )
      end

      before do
        cart_item # ensure cart_item is created
        allow(Stripe::Webhook).to receive(:construct_event).and_return(stripe_event)
        allow(Stripe::Checkout::Session).to receive(:retrieve).with("sess_123").and_return(
          OpenStruct.new(
            id: "sess_123",
            payment_status: "paid",
            shipping_cost: OpenStruct.new(amount_total: 500),
            amount_total: 20000,
            shipping_details: OpenStruct.new(
              address: OpenStruct.new(country: "US", to_h: { "country" => "US" }),
              name: "John Doe"
            ),
            customer_details: OpenStruct.new(phone: "123456789"),
            payment_intent: "pi_123",
            metadata: OpenStruct.new(cart_id: cart.id)
          )
        )
        allow(Stripe::PaymentIntent).to receive(:retrieve).with("pi_123").and_return({ "id" => "pi_123" })
      end

      it "completes the product purchase and updates all related records" do
        expect {
          post endpoint,
            params: {
              id: "evt_test_webhook",
              object: "event",
              type: event_type,
              data: {
                object: {
                  id: "sess_123",
                  metadata: { source_type: "product", purchase_id: purchase.id }
                }
              }
            }.to_json,
            headers: { "Stripe-Signature" => sig_header, "CONTENT_TYPE" => "application/json" }
        }.to change { purchase.reload.status }.from("pending").to("completed")
         .and change { purchase.product_purchase_items.count }.by(1)
         .and change { product.reload.stock_quantity }.by(-2)

        item = purchase.product_purchase_items.last


        expect(item.product).to eq(product)
        expect(item.quantity).to eq(2)
        expect(item.price).to eq(product.price)
        # expect(item.shipping_cost.to_f).to eq(500) # base_cost for 2 items, no additional cost for this test
        expect(purchase.shipping_address["country"]).to eq("US")
        expect(purchase.shipping_name).to eq("John Doe")
        expect(purchase.phone).to eq("123456789")
        expect(purchase.shipping_cost).to eq(5.0)
        expect(purchase.total_amount).to eq(200.0)
        expect(purchase.payment_intent_id).to eq("pi_123")
      end
    end
  end
end
