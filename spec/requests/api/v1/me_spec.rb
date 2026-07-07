require "rails_helper"

RSpec.describe "Api::V1::Me", type: :request do
  describe "GET /api/v1/me.json" do
    it "returns newsletter permission metadata for the signed in user" do
      user = create(
        :user,
        confirmed_at: Time.current,
        can_send_newsletter: true,
        mastering_allowed: true,
        newsletter_broadcast_recipient_limit: 250
      )

      sign_in user

      get "/api/v1/me.json"

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body)

      expect(payload.dig("current_user", "can_send_newsletter")).to eq(true)
      expect(payload.dig("current_user", "mastering_allowed")).to eq(true)
      expect(payload.dig("current_user", "newsletter_broadcast_recipient_limit")).to eq(250)
    end

    it "returns product creation payment readiness metadata" do
      user = create(
        :user,
        confirmed_at: Time.current,
        seller: true,
        stripe_account_id: "acct_ready"
      )

      sign_in user

      get "/api/v1/me.json"

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body)

      expect(payload.dig("current_user", "can_sell_products")).to eq(true)
      expect(payload.dig("current_user", "stripe_account_connected")).to eq(true)
      expect(payload.dig("current_user", "can_create_products")).to eq(true)
    end

    it "returns creator metadata used by the React user menu" do
      user = create(:user, role: :artist, confirmed_at: Time.current)

      sign_in user

      get "/api/v1/me.json"

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body)

      expect(payload.dig("current_user", "is_creator")).to eq(true)
    end
  end
end
