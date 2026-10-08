require "rails_helper"

RSpec.describe "ProductCarts", type: :request do
  let(:product) { create(:product) }

  context "when signed out" do
    it "requires sign in before adding a product without creating a cart or item" do
      product

      expect do
        post "/product_cart/add/#{product.id}.json"
      end.not_to change { [ProductCart.count, ProductCartItem.count] }

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to eq(
        "code" => "authentication_required",
        "error" => I18n.t("products.cart.sign_in_required")
      )
    end

    it "requires sign in before removing a product" do
      delete "/product_cart/remove/#{product.id}.json"

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)["code"]).to eq("authentication_required")
    end

    it "redirects HTML add requests to sign in" do
      post "/product_cart/add/#{product.id}"

      expect(response).to redirect_to(new_user_session_path)
      expect(flash[:alert]).to eq(I18n.t("products.cart.sign_in_required"))
    end

    it "returns an empty cart when viewing the cart" do
      get "/product_cart.json"

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to eq({})
    end
  end

  context "when signed in" do
    let(:buyer) { create(:user, confirmed_at: Time.current) }

    before { sign_in buyer }

    it "adds a product and increases its quantity on subsequent adds" do
      post "/product_cart/add/#{product.id}.json"

      expect(response).to have_http_status(:ok)
      expect(ProductCart.find_by!(user: buyer).product_cart_items.find_by!(product: product).quantity).to eq(1)

      post "/product_cart/add/#{product.id}.json"

      expect(response).to have_http_status(:ok)
      cart = JSON.parse(response.body).fetch("cart")
      expect(cart.fetch("items").size).to eq(1)
      expect(cart.fetch("items").first.fetch("product")).to include("id" => product.id, "quantity" => 2)
    end

    it "removes a product from the cart" do
      post "/product_cart/add/#{product.id}.json"

      expect do
        delete "/product_cart/remove/#{product.id}.json"
      end.to change(ProductCartItem, :count).by(-1)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).fetch("cart").fetch("items")).to eq([])
    end
  end
end
