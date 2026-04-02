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
        "event_sales",
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
      expect(json_response.dig("resource", "columns").map { |column| column["key"] }).to include("display_name", "stripe_active")
      expect(json_response["records"].map { |record| record.dig("values", "email") }).to include("artist@rauversion.com")
      expect(json_response["scope"]).to eq("sellers")
    end
  end

  describe "GET /api/admin/users/:id" do
    let!(:artist) do
      create(
        :user,
        email: "creator@rauversion.com",
        username: "creator-one",
        role: :artist,
        seller: true,
        stripe_account_id: "acct_123",
        tbk_commerce_code: "597055555532",
        tbk_test_mode: true,
        email_sign_up: true,
        google_analytics_id: "G-ABC123DEF4",
        age_restriction: "18",
        new_message_email: false,
        confirmed_at: Time.current
      )
    end

    it "returns extended form values for store attributes and stripe state" do
      get "/api/admin/users/#{artist.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("record", "form_values", "stripe_active")).to eq(true)
      expect(json_response.dig("record", "form_values", "stripe_account_id")).to eq("acct_123")
      expect(json_response.dig("record", "form_values", "tbk_commerce_code")).to eq("597055555532")
      expect(json_response.dig("record", "form_values", "tbk_test_mode")).to eq(true)
      expect(json_response.dig("record", "form_values", "email_sign_up")).to eq(true)
      expect(json_response.dig("record", "form_values", "google_analytics_id")).to eq("G-ABC123DEF4")
      expect(json_response.dig("record", "form_values", "age_restriction")).to eq("18")
      expect(json_response.dig("record", "form_values", "new_message_email")).to eq(false)
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

  describe "GET /api/admin/tracks/:id" do
    let(:artist) do
      create(
        :user,
        email: "detail-track@rauversion.com",
        username: "detail-track",
        role: :artist,
        confirmed_at: Time.current
      )
    end

    let!(:track) do
      create(
        :track,
        user: artist,
        title: "Insight Track",
        metadata: {
          genre: "House",
          bpm: 126,
          musical_key: "F minor",
          subgenres: ["Deep House"],
          reference_artists: ["Kerri Chandler"]
        }
      )
    end

    it "returns detailed track values for the admin show page" do
      get "/api/admin/tracks/#{track.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("resource", "editable")).to eq(true)
      expect(json_response.dig("record", "form_values", "title")).to eq("Insight Track")
      expect(json_response.dig("record", "form_values", "genre")).to eq("House")
      expect(json_response.dig("record", "form_values", "bpm")).to eq(126)
      expect(json_response.dig("record", "form_values", "subgenres")).to eq(["Deep House"])
      expect(json_response.dig("record", "form_values", "reference_artists")).to eq(["Kerri Chandler"])
    end
  end

  describe "PATCH /api/admin/tracks/:id" do
    let(:artist) do
      create(
        :user,
        email: "patch-track@rauversion.com",
        username: "patch-track",
        role: :artist,
        confirmed_at: Time.current
      )
    end

    let!(:track) do
      create(
        :track,
        user: artist,
        title: "Patch Me",
        genre: "Techno"
      )
    end

    it "updates editable analysis metadata fields" do
      patch "/api/admin/tracks/#{track.id}", params: {
        record: {
          genre: "House",
          bpm: 125,
          musical_key: "A minor",
          subgenres: ["Deep House", "Soulful House"],
          mood: ["Warm", "Late-night"],
          bpm_range: { min: 123, max: 127 },
          reference_artists: ["Moodymann"],
          tags: ["house", "warm"]
        }
      }, as: :json

      expect(response).to have_http_status(:ok)
      expect(track.reload.genre).to eq("House")
      expect(track.bpm).to eq(125)
      expect(track.musical_key).to eq("A minor")
      expect(track.subgenres).to eq(["Deep House", "Soulful House"])
      expect(track.mood).to eq(["Warm", "Late-night"])
      expect(track.bpm_range).to eq({ "min" => 123, "max" => 127 })
      expect(track.reference_artists).to eq(["Moodymann"])
      expect(track.tags).to eq(["house", "warm"])
    end
  end

  describe "POST /api/admin/tracks/:id/actions/analyze" do
    let(:artist) do
      create(
        :user,
        email: "analyze-track@rauversion.com",
        username: "analyze-track",
        role: :artist,
        confirmed_at: Time.current
      )
    end

    let!(:track) do
      create(
        :track,
        user: artist,
        title: "Analyze Me",
        state: "processed"
      )
    end

    it "passes the action payload into the analyzer service" do
      analyzer = instance_double(
        TrackAudioAnalysisService,
        call: {
          genre: "House",
          bpm: 126,
          reference_artists: ["Kerri Chandler"]
        }
      )

      expect(TrackAudioAnalysisService).to receive(:new).with(
        track: track,
        start_seconds: 8,
        duration_seconds: 45,
        persist: true
      ).and_return(analyzer)

      post "/api/admin/tracks/#{track.id}/actions/analyze", params: {
        payload: {
          start_seconds: 8,
          duration_seconds: 45,
          persist: true
        }
      }, as: :json

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("result", "genre")).to eq("House")
      expect(json_response.dig("result", "bpm")).to eq(126)
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

  describe "GET /api/admin/event_sales" do
    let(:organizer) do
      create(
        :user,
        email: "organizer@rauversion.com",
        username: "top-organizer",
        role: :artist,
        confirmed_at: Time.current
      )
    end

    let!(:event) do
      create(
        :event,
        user: organizer,
        title: "Warehouse Session",
        state: "published",
        visibility: "public"
      )
    end

    let!(:ticket) do
      create(
        :event_ticket,
        event: event,
        title: "General Admission",
        price: 25,
        qty: 7
      )
    end

    let!(:purchase) do
      create(
        :purchase,
        user: organizer,
        purchasable: event,
        state: "paid",
        currency: "usd"
      )
    end

    let!(:paid_item) do
      create(
        :purchased_item,
        purchase: purchase,
        purchased_item: ticket,
        state: "paid",
        price: 25,
        currency: "usd",
        created_at: Date.new(2026, 3, 10).in_time_zone.noon
      )
    end

    let!(:refunded_item) do
      create(
        :purchased_item,
        purchase: purchase,
        purchased_item: ticket,
        state: "refunded",
        price: 25,
        currency: "usd",
        created_at: Date.new(2026, 3, 11).in_time_zone.noon
      )
    end

    let!(:old_paid_item) do
      create(
        :purchased_item,
        purchase: purchase,
        purchased_item: ticket,
        state: "paid",
        price: 25,
        currency: "usd",
        created_at: Date.new(2026, 2, 28).in_time_zone.noon
      )
    end

    it "returns event ticket sales metrics" do
      get "/api/admin/event_sales", params: { from: "2026-03-08", to: "2026-03-12" }

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("range", "from")).to eq("2026-03-08")
      expect(json_response.dig("range", "to")).to eq("2026-03-12")
      expect(json_response.dig("summary", "sold_tickets")).to eq(1)
      expect(json_response.dig("summary", "remaining_tickets")).to eq(7)
      expect(json_response.dig("summary", "refunded_tickets")).to eq(1)
      expect(json_response["top_events"].first["title"]).to eq("Warehouse Session")
      expect(json_response["top_events"].first["sold_tickets"]).to eq(1)
      expect(json_response["top_ticket_types"].first["title"]).to eq("General Admission")
      expect(json_response["refunded_revenue_by_currency"].first["amount"].to_f).to eq(25.0)
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
