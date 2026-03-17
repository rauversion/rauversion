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

    before do
      track.video.attach(
        io: StringIO.new("fake-video"),
        filename: "player-clip.mp4",
        content_type: "video/mp4"
      )
      track.video_web.attach(
        io: StringIO.new("fake-video-web"),
        filename: "player-clip-web.mp4",
        content_type: "video/mp4"
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
      expect(json.dig("track", "video_url")).to include("player-clip-web.mp4")
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
