require "rails_helper"

RSpec.describe "Product sales setup", type: :request do
  describe "POST /:username/products/music.json" do
    it "lets connected sellers create pickup-only products and exposes the setting for editing" do
      user = create(:user, confirmed_at: Time.current, role: "artist", seller: true, stripe_account_id: "acct_seller")
      sign_in user

      post "/#{user.username}/products/music.json", params: {
        product: {
          title: "Pickup vinyl", description: "Limited pressing", category: "vinyl",
          price: "10.00", currency: "usd", stock_quantity: 1, status: "active",
          sku: "pickup-vinyl", condition: "new", allow_pickup: true
        }
      }

      expect(response).to have_http_status(:created)
      product = Products::MusicProduct.last
      expect(product).to be_allow_pickup
      expect(product.product_shippings).to be_empty

      get "/#{user.username}/products/music/#{product.slug}.json"
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).fetch("product")["allow_pickup"]).to eq(true)

      patch "/#{user.username}/products/music/#{product.slug}.json", params: {
        product: { allow_pickup: false, shipping_days: 3,
          product_shippings_attributes: [{ country: "CL", base_cost: 3_000, additional_cost: 0 }] }
      }
      expect(response).to have_http_status(:created)
      expect(product.reload).not_to be_allow_pickup
    end

    it "blocks sellers without a connected Stripe account" do
      user = create(:user, confirmed_at: Time.current, role: "artist", seller: true, stripe_account_id: nil)

      sign_in user

      post "/#{user.username}/products/music.json", params: {
        product: {
          title: "Vinyl",
          description: "Limited pressing",
          category: "vinyl",
          format: "vinyl",
          price: "10.00",
          currency: "usd",
          stock_quantity: 1,
          status: "active"
        }
      }

      expect(response).to have_http_status(:payment_required)

      payload = JSON.parse(response.body)
      expect(payload["code"]).to eq("stripe_required")
      expect(payload["redirect_to"]).to eq("/#{user.username}/settings/stripe")
      expect(Product.count).to eq(0)
    end
  end
end
