require "rails_helper"

RSpec.describe "Admin API", type: :request do
  def json_response
    JSON.parse(response.body)
  end

  let(:admin) do
    create(
      :admin_user,
      email: "admin@rauversion.com",
      username: "rauversion-admin",
      confirmed_at: Time.current
    )
  end

  before do
    sign_in admin
  end

  describe "GET /api/admin/meta" do
    it "returns the admin navigation" do
      get "/api/admin/meta"

      expect(response).to have_http_status(:ok)
      expect(json_response["navigation"].map { |item| item["key"] }).to include(
        "commerce",
        "listening",
        "pages",
        "users",
        "categories",
        "tracks",
        "events",
        "posts",
        "terms_and_conditions",
        "interest_alerts"
      )
    end
  end

  describe "GET /api/admin/users" do
    let!(:artist) do
      create(
        :user,
        email: "artist@rauversion.com",
        username: "artist-one",
        role: :artist,
        seller: true,
        confirmed_at: Time.current
      )
    end

    it "serializes resource metadata and records" do
      get "/api/admin/users", params: { scope: "sellers" }

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("resource", "label")).to eq("Users")
      expect(json_response["records"].map { |record| record.dig("values", "email") }).to include("artist@rauversion.com")
      expect(json_response["scope"]).to eq("sellers")
    end
  end

  describe "GET /api/admin/tracks" do
    let(:artist) do
      create(
        :user,
        email: "tracks-artist@rauversion.com",
        username: "tracks-artist",
        role: :artist,
        confirmed_at: Time.current
      )
    end

    let!(:older_track) do
      create(
        :track,
        user: artist,
        title: "Older Track",
        state: "processed",
        created_at: 2.days.ago
      )
    end

    let!(:newer_track) do
      create(
        :track,
        user: artist,
        title: "Newer Track",
        state: "processed",
        created_at: 1.day.ago
      )
    end

    it "returns tracks in descending order" do
      get "/api/admin/tracks"

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("resource", "label")).to eq("Tracks")
      expect(json_response["records"].map { |record| record["id"] }.first(2)).to eq([newer_track.id, older_track.id])
    end
  end

  describe "GET /api/admin/events" do
    let(:organizer) do
      create(
        :user,
        email: "events-organizer@rauversion.com",
        username: "events-organizer",
        role: :artist,
        confirmed_at: Time.current
      )
    end

    let!(:older_event) do
      create(
        :event,
        user: organizer,
        title: "Older Event",
        state: "draft",
        visibility: "public",
        created_at: 2.days.ago
      )
    end

    let!(:newer_event) do
      create(
        :event,
        user: organizer,
        title: "Newer Event",
        state: "published",
        visibility: "public",
        created_at: 1.day.ago
      )
    end

    it "returns events in descending order" do
      get "/api/admin/events"

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("resource", "label")).to eq("Events")
      expect(json_response["records"].map { |record| record["id"] }.first(2)).to eq([newer_event.id, older_event.id])
    end
  end

  describe "POST /api/admin/interest_alerts/:id/actions/approve" do
    let(:requester) do
      create(
        :user,
        email: "seller-request@rauversion.com",
        username: "seller-request",
        confirmed_at: Time.current
      )
    end

    let!(:interest_alert) do
      InterestAlert.create!(
        user: requester,
        body: "I want to sell products on the platform.",
        role: "seller"
      )
    end

    it "approves the request and updates the user" do
      post "/api/admin/interest_alerts/#{interest_alert.id}/actions/approve"

      expect(response).to have_http_status(:ok)
      expect(interest_alert.reload).to be_approved
      expect(requester.reload.seller).to be(true)
      expect(requester.role).to eq("artist")
      expect(json_response.dig("record", "form_values", "approved")).to eq(true)
    end
  end

  describe "GET /api/admin/dashboard" do
    let(:seller) do
      create(
        :user,
        email: "merchant@rauversion.com",
        username: "merchant-one",
        role: :artist,
        seller: true,
        confirmed_at: Time.current
      )
    end

    let(:buyer) do
      create(
        :user,
        email: "buyer@rauversion.com",
        username: "buyer-one",
        confirmed_at: Time.current
      )
    end

    let!(:product) do
      create(
        :product,
        user: seller,
        title: "Synth Pack",
        description: "Vintage synth bundle",
        category: "Music",
        status: "active",
        price: 35,
        stock_quantity: 10
      )
    end

    let!(:purchase) do
      create(
        :product_purchase,
        user: buyer,
        status: "completed",
        total_amount: 70,
        currency: "usd",
        payment_intent_id: "pi_123"
      )
    end

    let!(:purchase_item) do
      create(
        :product_purchase_item,
        product_purchase: purchase,
        product: product,
        quantity: 2,
        price: 35,
        currency: "usd"
      )
    end

    it "returns global commerce metrics" do
      get "/api/admin/dashboard"

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("summary", "paid_orders")).to eq(1)
      expect(json_response.dig("summary", "items_sold")).to eq(2)
      expect(json_response["top_products"].first["title"]).to eq("Synth Pack")
      expect(json_response["top_sellers"].first["name"]).to eq(seller.display_name)
    end
  end

  describe "GET /api/admin/listening" do
    let(:artist) do
      create(
        :user,
        email: "artist@rauversion.com",
        username: "listener-artist",
        role: :artist,
        confirmed_at: Time.current
      )
    end

    let(:listener) do
      create(
        :user,
        email: "listener@rauversion.com",
        username: "listener-one",
        confirmed_at: Time.current
      )
    end

    let!(:track) do
      create(
        :track,
        user: artist,
        title: "Peak Hour",
        state: "processed",
        private: false
      )
    end

    let!(:playlist) do
      create(
        :playlist,
        user: artist,
        title: "Late Night Set",
        private: false,
        playlist_type: "playlist"
      )
    end

    let!(:top_track_listens) do
      create_list(
        :listening_event,
        3,
        user: listener,
        track: track,
        playlist: playlist,
        country: "CL",
        created_at: Date.new(2026, 3, 10).in_time_zone.noon
      )
    end

    let!(:other_listen) do
      create(
        :listening_event,
        country: "AR",
        created_at: Date.new(2026, 3, 1).in_time_zone.noon
      )
    end

    it "returns listening aggregates" do
      get "/api/admin/listening", params: { from: "2026-03-08", to: "2026-03-12" }

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("range", "from")).to eq("2026-03-08")
      expect(json_response.dig("range", "to")).to eq("2026-03-12")
      expect(json_response.dig("summary", "total_plays")).to eq(3)
      expect(json_response.dig("summary", "accounts_count")).to eq(1)
      expect(json_response.dig("summary", "tracks_count")).to eq(1)
      expect(json_response["top_tracks"].first["title"]).to eq("Peak Hour")
      expect(json_response["top_tracks"].first["plays_count"]).to eq(3)
      expect(json_response["top_accounts"].first["name"]).to eq(listener.display_name)
      expect(json_response["top_playlists"].first["title"]).to eq("Late Night Set")
      expect(json_response["top_countries"].first["country"]).to eq("CL")
      expect(json_response["plays_series"].find { |entry| entry["date"] == "2026-03-10" }["plays_count"]).to eq(3)
    end
  end

  describe "authorization" do
    let(:regular_user) do
      create(
        :user,
        email: "plain@rauversion.com",
        username: "plain-user",
        confirmed_at: Time.current
      )
    end

    it "rejects non-admin users" do
      sign_out admin
      sign_in regular_user

      get "/api/admin/meta"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
