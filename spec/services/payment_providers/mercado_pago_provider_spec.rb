require "rails_helper"

RSpec.describe PaymentProviders::MercadoPagoProvider, type: :service do
  let(:buyer) { create(:user) }
  let(:seller) { create(:user) }

  before do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with("PLATFORM_EVENTS_FEE", 10).and_return("10")
  end

  describe "digital checkout fees" do
    let(:product) { create(:product, user: seller, price: 100, currency: "usd") }
    let(:purchase) do
      create(:purchase, user: buyer, purchasable: product, price: 100, currency: "usd")
    end

    it "adds the commission as a separate buyer item" do
      provider = described_class.new(user: buyer, purchasable: product)

      payload = provider.send(:build_digital_preference_data, purchase, "track", nil)

      expect(payload[:items]).to include(
        hash_including(
          title: "Cargo por servicio",
          quantity: 1,
          currency_id: "USD",
          unit_price: 10.0
        )
      )
      expect(payload[:items].sum { |item| item[:unit_price] * item[:quantity] }).to eq(110.0)
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

    it "adds the commission on top of the cart subtotal" do
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase)

      payload = provider.send(:build_preference_data, nil)

      expect(payload[:items]).to include(
        hash_including(
          title: "Cargo por servicio",
          quantity: 1,
          currency_id: "USD",
          unit_price: 20.0
        )
      )
      expect(payload[:items].sum { |item| item[:unit_price] * item[:quantity] }).to eq(220.0)
      expect(cart.total_price).to eq(200)
    end

    it "persists seller-enabled pickup when creating the payment preference" do
      product.update!(allow_pickup: true)
      preference = double(create: { status: 201, response: { "id" => "mp_pickup", "init_point" => "https://mercadopago.com/checkout" } })
      allow(Mercadopago::SDK).to receive(:new).and_return(double(preference: preference))
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase, delivery_method: "local_pickup")

      expect(provider.create_checkout_session).to eq(checkout_url: "https://mercadopago.com/checkout")
      expect(purchase.reload.delivery_method).to eq("local_pickup")
    end

    it "rejects pickup when the seller has not enabled it" do
      allow(Mercadopago::SDK).to receive(:new)
      provider = described_class.new(user: buyer, cart: cart, purchase: purchase, delivery_method: "local_pickup")

      expect(provider.create_checkout_session).to eq(error: I18n.t("products.cart.pickup_unavailable"))
      expect(Mercadopago::SDK).not_to have_received(:new)
    end
  end
end
