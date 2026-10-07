require "rails_helper"

RSpec.describe "ProductCheckouts", type: :request do
  let(:buyer) { create(:user, confirmed_at: Time.current) }
  let(:seller) { create(:user, stripe_account_id: "acct_seller") }
  let(:product) { create(:product, user: seller, price: 100, stock_quantity: 10) }

  before do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with("PLATFORM_EVENTS_FEE", 10).and_return("10")
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("PLATFORM_MARKETPLACE_FEE").and_return("8")
    allow(ENV).to receive(:[]).with("DEFAULT_PAYMENT_GATEWAY").and_return("stripe")
    allow(ENV).to receive(:fetch).with("STRIPE_PRODUCT_PROCESSING_FEE_PERCENTAGE", "2.9").and_return("2.9")
    allow(ENV).to receive(:fetch).with("STRIPE_PRODUCT_PROCESSING_FIXED_FEE_USD", "0.30").and_return("0.30")
    sign_in buyer
    post "/product_cart/add/#{product.id}.json"
    allow(Stripe::Checkout::Session).to receive(:create).and_return(
      double(id: "cs_product", url: "https://checkout.stripe.com/product")
    )
  end

  it "creates a checkout that automatically deducts processing costs from the seller" do
    expect { post "/product_checkout.json", params: { provider: "stripe" } }.to change(ProductPurchase, :count).by(1)

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)).to eq("checkout_url" => "https://checkout.stripe.com/product")
    expect(ProductPurchase.last).to have_attributes(
      currency: "usd", stripe_session_id: "cs_product", status: "pending"
    )
    expect(Stripe::Checkout::Session).to have_received(:create).with(hash_including(
      payment_intent_data: hash_including(application_fee_amount: 1_143,
        transfer_data: { destination: "acct_seller" })
    ))
  end

  it "reports unsupported multiple sellers and rolls back the pending purchase" do
    other_seller = create(:user, stripe_account_id: "acct_other")
    other_product = create(:product, user: other_seller)
    post "/product_cart/add/#{other_product.id}.json"

    expect { post "/product_checkout.json", params: { provider: "stripe" } }.not_to change(ProductPurchase, :count)

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)["error"]).to eq("Products must belong to a single connected Stripe seller")
    expect(Stripe::Checkout::Session).not_to have_received(:create)
  end

  it "passes the selected destination to Stripe and includes that shipping in processing costs" do
    product.update!(price: 10)
    create(:product_shipping, product: product, country: "US", base_cost: 5, additional_cost: 0)
    create(:product_shipping, product: product, country: "AX", base_cost: 10, additional_cost: 0)

    get "/product_cart.json"
    cart = JSON.parse(response.body).fetch("cart")
    expect(cart["shipping_country_required"]).to eq(true)
    expect(cart["shipping_options"]).to include(hash_including("country" => "AX", "formatted_amount" => "USD 10"))

    post "/product_checkout.json", params: { provider: "stripe", shipping_country: "AX", shipping_cost: 0 }

    expect(response).to have_http_status(:ok)
    expect(Stripe::Checkout::Session).to have_received(:create).with(hash_including(
      shipping_address_collection: { allowed_countries: ["AX"] },
      payment_intent_data: hash_including(application_fee_amount: 170,
        metadata: hash_including(shipping_fee_amount: 1_000, estimated_processing_fee_amount: 90))
    ))
  end

  it "requires a shipping destination when rates differ and rolls back the pending purchase" do
    create(:product_shipping, product: product, country: "US", base_cost: 5, additional_cost: 0)
    create(:product_shipping, product: product, country: "AX", base_cost: 10, additional_cost: 0)

    expect { post "/product_checkout.json", params: { provider: "stripe" } }.not_to change(ProductPurchase, :count)

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)["error"]).to eq(I18n.t("products.cart.choose_shipping_country"))
    expect(Stripe::Checkout::Session).not_to have_received(:create)
  end

  it "reports Stripe errors and rolls back the pending purchase" do
    allow(Stripe::Checkout::Session).to receive(:create).and_raise(Stripe::InvalidRequestError.new("Checkout unavailable", nil))

    expect { post "/product_checkout.json", params: { provider: "stripe" } }.not_to change(ProductPurchase, :count)

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)).to eq("error" => "Checkout unavailable")
  end
end
