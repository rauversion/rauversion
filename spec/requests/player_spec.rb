require "rails_helper"

RSpec.describe "Players", type: :request do
  describe "GET /player.json" do
    let(:artist) { create(:user, confirmed_at: Time.current, role: :artist) }
    let(:listener) { create(:user, confirmed_at: Time.current) }
    let!(:track) { create(:track, user: artist, private: false, title: "Player Track") }
    let!(:like) do
      Like.create!(
        liker_type: "User",
        liker_id: listener.id,
        likeable_type: "Track",
        likeable_id: track.id
      )
    end

    it "returns public player metadata for guests without user like state" do
      get "/player.json", params: { id: track.id }

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)

      expect(json.fetch("track")).to include(
        "id" => track.id,
        "slug" => track.slug,
        "likes_count" => 1,
        "like_id" => false,
        "liked_by_current_user" => false
      )
    end

    it "returns player metadata with the current user's like state" do
      sign_in listener

      get "/player.json", params: { id: track.id }

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)

      expect(json.fetch("track")).to include(
        "id" => track.id,
        "slug" => track.slug,
        "likes_count" => 1,
        "like_id" => true,
        "liked_by_current_user" => true
      )
    end
  end
end
