require "rails_helper"

RSpec.describe "Product sales setup", type: :request do
  describe "POST /:username/products/music.json" do
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
