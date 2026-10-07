require "rails_helper"

RSpec.describe PaymentProviders::StripeProvider, type: :service do
  let(:buyer) { create(:user) }
  let(:seller) { create(:user, stripe_account_id: "acct_seller") }

  before do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with("PLATFORM_EVENTS_FEE", 10).and_return("10")
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("PLATFORM_MARKETPLACE_FEE").and_return("8")
    allow(ENV).to receive(:fetch).with("STRIPE_PRODUCT_PROCESSING_FEE_PERCENTAGE", "2.9").and_return("2.9")
    allow(ENV).to receive(:fetch).with("STRIPE_PRODUCT_PROCESSING_FIXED_FEE_USD", "0.30").and_return("0.30")
    allow(ENV).to receive(:fetch).with("STRIPE_PRODUCT_PROCESSING_FIXED_FEE_CLP", "0").and_return("0")
  end

  describe "digital checkout fees" do
    let(:product) { create(:product, user: seller, price: 100, currency: "usd") }
    let(:purchase) do
      create(:purchase, user: buyer, purchasable: product, price: 100, currency: "usd")
    end

    it "adds the platform commission to the buyer total and preserves the seller price" do
      provider = described_class.new(user: buyer, purchasable: product)

      params = provider.send(:build_digital_checkout_params, purchase, "track", seller.stripe_account_id)
      charged_amount = params[:line_items].sum { |item| item["price_data"]["unit_amount"] * item["quantity"] }
      application_fee = params.dig(:payment_intent_data, :application_fee_amount)

      expect(params[:line_items]).to include(
        hash_including(
          "quantity" => 1,
          "price_data" => hash_including(
            "unit_amount" => 1_000,
            "currency" => "usd",
            "product_data" => hash_including("name" => "Cargo por servicio")
          )
        )
      )
      expect(charged_amount).to eq(11_000)
      expect(application_fee).to eq(1_000)
      expect(charged_amount - application_fee).to eq(10_000)
      expect(purchase.price).to eq(100)
    end
  end

  describe "marketplace checkout fees" do
    let(:product) { create(:product, user: seller, price: 100, currency: "usd") }
    let(:cart) { ProductCart.create!(user: buyer) }
    let(:purchase) { create(:product_purchase, user: buyer, status: :pending) }

    before do
      cart.add_product(product, 2)
    end

    it "keeps the buyer service fee and deducts estimated processing costs through the automatic transfer" do
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      params = provider.send(:build_checkout_params, nil)
      charged_amount = params[:line_items].sum do |item|
        price_data = item[:price_data] || item["price_data"]
        quantity = item[:quantity] || item["quantity"]
        unit_amount = price_data[:unit_amount] || price_data["unit_amount"]
        unit_amount * quantity
      end

      expect(params[:line_items]).to include(
        hash_including(
          "quantity" => 1,
          "price_data" => hash_including(
            "unit_amount" => 1_600,
            "currency" => "usd",
            "product_data" => hash_including("name" => "Cargo por servicio")
          )
        )
      )
      expect(charged_amount).to eq(21_600)
      expect(params.dig(:payment_intent_data, :application_fee_amount)).to eq(2_256)
      expect(params.dig(:payment_intent_data, :transfer_data)).to eq(destination: "acct_seller")
      expect(charged_amount - params.dig(:payment_intent_data, :application_fee_amount)).to eq(19_344)
      expect(params.dig(:payment_intent_data, :metadata)).to include(
        processing_fee_payer: "seller", processing_fee_model: "estimated",
        service_fee_amount: 1_600, estimated_processing_fee_amount: 656
      )
      expect(params[:payment_intent_data]).not_to have_key(:transfer_group)
      expect(params).not_to have_key(:payment_method_types)
      expect(cart.total_price).to eq(200)
    end

    it "creates one checkout with the automatic seller destination" do
      allow(Stripe::Checkout::Session).to receive(:create).and_return(double(id: "cs_product", url: "https://checkout.stripe.com/product"))
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      expect(provider.create_checkout_session).to eq(checkout_url: "https://checkout.stripe.com/product")
      expect(purchase.reload).to have_attributes(
        stripe_session_id: "cs_product",
        currency: "usd"
      )
      expect(Stripe::Checkout::Session).to have_received(:create).with(hash_including(
        payment_intent_data: hash_including(
          application_fee_amount: 2_256, transfer_data: { destination: "acct_seller" }
        )
      ))
    end

    it "includes shipping in the seller's processing estimate for the USD 20.80 payment" do
      product.update!(price: 10)
      cart.product_cart_items.first.update!(quantity: 1)
      create(:product_shipping, product: product, country: "AX", base_cost: 10, additional_cost: 0)
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      params = provider.send(:build_checkout_params, nil)

      expect(params[:metadata]).to include(service_fee_amount: 80, shipping_fee_amount: 1_000,
        processing_fee_base_amount: 2_080, estimated_processing_fee_amount: 90)
      expect(params.dig(:payment_intent_data, :application_fee_amount)).to eq(170)
      expect(2_080 - params.dig(:payment_intent_data, :application_fee_amount)).to eq(1_910)
      expect(params.dig(:shipping_options, 0, :shipping_rate_data, :fixed_amount, :amount)).to eq(1_000)
    end

    it "uses the selected country's shipping price and restricts Checkout to that destination" do
      create(:product_shipping, product: product, country: "US", base_cost: 5, additional_cost: 0)
      create(:product_shipping, product: product, country: "AX", base_cost: 10, additional_cost: 0)
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase, shipping_country: "AX")

      params = provider.send(:build_checkout_params, nil)

      expect(params[:shipping_options].size).to eq(1)
      expect(params[:shipping_address_collection]).to eq(allowed_countries: ["AX"])
      expect(params[:metadata]).to include(shipping_fee_amount: 1_000, processing_fee_base_amount: 22_600,
        estimated_processing_fee_amount: 685)
      expect(params.dig(:payment_intent_data, :application_fee_amount)).to eq(2_285)
    end

    it "requires a destination when shipping prices differ before contacting Stripe" do
      create(:product_shipping, product: product, country: "US", base_cost: 5, additional_cost: 0)
      create(:product_shipping, product: product, country: "AX", base_cost: 10, additional_cost: 0)
      allow(Stripe::Checkout::Session).to receive(:create)
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      expect(provider.create_checkout_session[:error]).to eq(I18n.t("products.cart.choose_shipping_country"))
      expect(Stripe::Checkout::Session).not_to have_received(:create)
    end

    it "rejects an unsupported shipping country before contacting Stripe" do
      create(:product_shipping, product: product, country: "US", base_cost: 5, additional_cost: 0)
      allow(Stripe::Checkout::Session).to receive(:create)
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase, shipping_country: "AX")

      expect(provider.create_checkout_session[:error]).to eq(I18n.t("products.cart.shipping_unavailable"))
      expect(Stripe::Checkout::Session).not_to have_received(:create)
    end

    it "includes equal shipping rates without requiring a country before Checkout" do
      create(:product_shipping, product: product, country: "US", base_cost: 10, additional_cost: 0)
      create(:product_shipping, product: product, country: "AX", base_cost: 10, additional_cost: 0)
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      params = provider.send(:build_checkout_params, nil)

      expect(params[:shipping_address_collection][:allowed_countries]).to contain_exactly("US", "AX")
      expect(params[:shipping_options].size).to eq(2)
      expect(params[:metadata]).to include(shipping_fee_amount: 1_000, estimated_processing_fee_amount: 685)
    end

    it "aggregates shipping from all products and additional units" do
      create(:product_shipping, product: product, country: "US", base_cost: 10, additional_cost: 2)
      other_product = create(:product, user: seller, price: 20, currency: "usd")
      create(:product_shipping, product: other_product, country: "US", base_cost: 5, additional_cost: 1)
      cart.add_product(other_product, 3)
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      params = provider.send(:build_checkout_params, nil)

      expect(params[:metadata]).to include(shipping_fee_amount: 1_900, processing_fee_base_amount: 29_980,
        estimated_processing_fee_amount: 899)
      expect(params.dig(:shipping_options, 0, :shipping_rate_data, :fixed_amount, :amount)).to eq(1_900)
    end

    it "keeps CLP amounts in pesos and does not apply the USD fixed fee" do
      product.update!(price: 10_000, currency: "clp")
      allow(Stripe::Checkout::Session).to receive(:create).and_return(double(id: "cs_product", url: "https://checkout.stripe.com/product"))
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      provider.create_checkout_session

      expect(purchase.reload.currency).to eq("clp")
      expect(Stripe::Checkout::Session).to have_received(:create).with(hash_including(
        payment_intent_data: hash_including(application_fee_amount: 2_226)
      ))
    end

    it "uses the marketplace rate independently of the ticket commission" do
      allow(ENV).to receive(:[]).with("PLATFORM_MARKETPLACE_FEE").and_return("12.5")
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      params = provider.send(:build_checkout_params, nil)

      expect(params.dig(:metadata, :service_fee_amount)).to eq(2_500)
      expect(params.dig(:payment_intent_data, :application_fee_amount)).to eq(3_183)
    end

    it "defaults the marketplace commission to eight percent" do
      allow(ENV).to receive(:[]).with("PLATFORM_MARKETPLACE_FEE").and_return(nil)
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      expect(provider.send(:build_checkout_params, nil).dig(:metadata, :service_fee_amount)).to eq(1_600)
    end

    it "allows a processing estimate to change without changing the buyer price" do
      allow(ENV).to receive(:fetch).with("STRIPE_PRODUCT_PROCESSING_FEE_PERCENTAGE", "2.9").and_return("5.4")
      allow(ENV).to receive(:fetch).with("STRIPE_PRODUCT_PROCESSING_FIXED_FEE_USD", "0.30").and_return("0.60")
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      params = provider.send(:build_checkout_params, nil)

      expect(params.dig(:metadata, :service_fee_amount)).to eq(1_600)
      expect(params.dig(:metadata, :estimated_processing_fee_amount)).to eq(1_226)
      expect(params.dig(:payment_intent_data, :application_fee_amount)).to eq(2_826)
      expect(params[:line_items].size).to eq(2)
    end

    it "supports a fixed processing fee configured in pesos" do
      product.update!(price: 10_000, currency: "clp")
      allow(ENV).to receive(:fetch).with("STRIPE_PRODUCT_PROCESSING_FIXED_FEE_CLP", "0").and_return("300")
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      expect(provider.send(:build_checkout_params, nil).dig(:payment_intent_data, :application_fee_amount)).to eq(2_526)
    end

    it "deducts processing costs even when Rauversion's service fee is zero" do
      allow(ENV).to receive(:[]).with("PLATFORM_MARKETPLACE_FEE").and_return("0")
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      params = provider.send(:build_checkout_params, nil)

      expect(params[:line_items].size).to eq(1)
      expect(params.dig(:payment_intent_data, :application_fee_amount)).to eq(610)
    end

    it "fails before charging when the processing estimate is invalid" do
      allow(ENV).to receive(:fetch).with("STRIPE_PRODUCT_PROCESSING_FEE_PERCENTAGE", "2.9").and_return("oops")
      allow(Stripe::Checkout::Session).to receive(:create)
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      expect(provider.create_checkout_session[:error]).to eq("Invalid Stripe product processing fee estimate")
      expect(Stripe::Checkout::Session).not_to have_received(:create)
    end

    it "rejects a negative fixed processing fee" do
      allow(ENV).to receive(:fetch).with("STRIPE_PRODUCT_PROCESSING_FIXED_FEE_USD", "0.30").and_return("-0.30")
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      expect(provider.create_checkout_session[:error]).to be_present
    end

    it "estimates processing costs on the discounted checkout total" do
      allow(Stripe::Coupon).to receive(:create).and_return(double(id: "SAVE20"))
      coupon = Coupon.create!(user: seller, code: "SAVE20", discount_type: :percentage,
        discount_amount: 20, expires_at: 1.day.from_now)
      product.update!(coupon: coupon)
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      params = provider.send(:build_checkout_params, "SAVE20")

      expect(params[:discounts]).to eq([{ coupon: "SAVE20" }])
      expect(params.dig(:metadata, :estimated_processing_fee_amount)).to eq(531)
      expect(params.dig(:payment_intent_data, :application_fee_amount)).to eq(2_131)
    end

    it "includes full shipping after applying a coupon to the product and service fee" do
      allow(Stripe::Coupon).to receive(:create).and_return(double(id: "SAVE20"))
      coupon = Coupon.create!(user: seller, code: "SAVE20", discount_type: :percentage,
        discount_amount: 20, expires_at: 1.day.from_now)
      product.update!(coupon: coupon)
      create(:product_shipping, product: product, country: "US", base_cost: 10, additional_cost: 0)
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      params = provider.send(:build_checkout_params, "SAVE20")

      expect(params[:metadata]).to include(shipping_fee_amount: 1_000, processing_fee_base_amount: 18_280,
        estimated_processing_fee_amount: 560)
      expect(params.dig(:payment_intent_data, :application_fee_amount)).to eq(2_160)
    end

    it "includes CLP shipping in pesos in the processing estimate" do
      product.update!(price: 10_000, currency: "clp")
      create(:product_shipping, product: product, country: "CL", base_cost: 3_000, additional_cost: 0)
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      params = provider.send(:build_checkout_params, nil)

      expect(params[:metadata]).to include(shipping_fee_amount: 3_000, processing_fee_base_amount: 24_600,
        estimated_processing_fee_amount: 713)
      expect(params.dig(:payment_intent_data, :application_fee_amount)).to eq(2_313)
    end

    it "caps the retained fee at a heavily discounted charge amount" do
      allow(Stripe::Coupon).to receive(:create).and_return(double(id: "SAVE99"))
      coupon = Coupon.create!(user: seller, code: "SAVE99", discount_type: :percentage,
        discount_amount: 99, expires_at: 1.day.from_now)
      product.update!(coupon: coupon)
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      expect(provider.send(:build_checkout_params, "SAVE99").dig(:payment_intent_data, :application_fee_amount)).to eq(216)
    end

    it "rejects products from multiple sellers instead of paying the first seller" do
      other_seller = create(:user, stripe_account_id: "acct_other")
      cart.add_product(create(:product, user: other_seller), 1)
      allow(Stripe::Checkout::Session).to receive(:create)
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      expect(provider.create_checkout_session[:error]).to be_present
      expect(Stripe::Checkout::Session).not_to have_received(:create)
    end

    it "rejects sellers without a connected account" do
      seller.update!(stripe_account_id: nil)
      allow(Stripe::Checkout::Session).to receive(:create)
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      expect(provider.create_checkout_session[:error]).to be_present
      expect(Stripe::Checkout::Session).not_to have_received(:create)
    end
  end
end
