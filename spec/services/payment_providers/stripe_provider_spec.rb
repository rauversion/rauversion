require "rails_helper"

RSpec.describe PaymentProviders::StripeProvider, type: :service do
  let(:buyer) { create(:user) }
  let(:seller) { create(:user, stripe_account_id: "acct_seller") }

  before do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with("PLATFORM_EVENTS_FEE", 10).and_return("10")
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

    it "adds one visible fee and transfers the full product subtotal to the seller" do
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      params = provider.send(:build_checkout_params, nil)
      charged_amount = params[:line_items].sum do |item|
        price_data = item[:price_data] || item["price_data"]
        quantity = item[:quantity] || item["quantity"]
        unit_amount = price_data[:unit_amount] || price_data["unit_amount"]
        unit_amount * quantity
      end
      application_fee = params.dig(:payment_intent_data, :application_fee_amount)

      expect(params[:line_items]).to include(
        hash_including(
          "quantity" => 1,
          "price_data" => hash_including(
            "unit_amount" => 2_000,
            "currency" => "usd",
            "product_data" => hash_including("name" => "Cargo por servicio")
          )
        )
      )
      expect(charged_amount).to eq(22_000)
      expect(application_fee).to eq(2_000)
      expect(charged_amount - application_fee).to eq(20_000)
      expect(cart.total_price).to eq(200)
    end
  end
end
