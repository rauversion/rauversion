require "rails_helper"

RSpec.describe "Product sales setup", type: :request do
  describe "POST /:username/products/music.json" do
    it "enables pickup on an existing music product and preserves its shipping rates" do
      user = create(:user, confirmed_at: Time.current, role: "artist", seller: true, stripe_account_id: "acct_seller")
      product = Products::MusicProduct.create!(
        user: user, title: "Existing vinyl", description: "An existing release", category: "vinyl",
        sku: "existing-vinyl", price: 32, currency: "usd", stock_quantity: 10, status: "active",
        condition: "new", shipping_days: 5,
        product_shippings_attributes: [{ country: "CL", base_cost: 5, additional_cost: 2 }]
      )
      shipping = product.product_shippings.first
      sign_in user

      patch "/#{user.username}/products/music/#{product.slug}.json", params: {
        product: { allow_pickup: true,
          product_shippings_attributes: [{ id: shipping.id, country: "CL", base_cost: 5, additional_cost: 2 }] }
      }

      expect(response).to have_http_status(:created)
      expect(product.reload).to be_allow_pickup
      expect(product.product_shippings.pluck(:id)).to eq([shipping.id])

      get "/#{user.username}/products/#{product.slug}.json"
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).fetch("product")).to include("allow_pickup" => true,
        "shipping_options" => [hash_including("id" => shipping.id)])

      sign_out user
      buyer = create(:user, confirmed_at: Time.current)
      sign_in buyer
      post "/product_cart/add/#{product.id}.json"
      expect(JSON.parse(response.body).fetch("cart")).to include("pickup_available" => true,
        "requires_pickup" => false)
    end

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
