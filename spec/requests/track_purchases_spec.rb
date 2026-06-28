require "rails_helper"

RSpec.describe "TrackPurchases", type: :request do
  describe "POST /tracks/:track_id/track_purchases.json" do
    let(:buyer) { create(:user, confirmed_at: Time.current) }
    let(:artist) { create(:user, confirmed_at: Time.current) }
    let(:track) { create(:track, user: artist, dj_set: true, title: "Rights Review Mix") }

    it "blocks monetization for DJ sets" do
      sign_in buyer

      post track_track_purchases_path(track, format: :json),
        params: {
          payment: {
            price: 1000
          }
        },
        as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)).to include(
        "error" => I18n.t("tracks.dj_sets.purchase_disabled")
      )
    end
  end
end
