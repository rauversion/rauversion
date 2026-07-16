require "rails_helper"

RSpec.describe "User radio", type: :request do
  let(:artist) do
    create(
      :user,
      role: :artist,
      confirmed_at: Time.current,
      username: "rau-studio",
      display_name: "Rau Studio",
      radio_stream_url: "http://127.0.0.1:8000/live.mp3"
    )
  end

  before do
    Rails.cache.clear
  end

  describe "GET /:username/radio" do
    it "serves the chrome-free React radio page" do
      get "/#{artist.username}/radio"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include('id="react-root"')
      expect(response.body).to include("Rau Studio Radio — Live on Rauversion")
    end

    it "returns the public radio configuration as JSON" do
      get "/#{artist.username}/radio.json"

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload).to include(
        "configured" => true,
        "stream_url" => "http://127.0.0.1:8000/live.mp3",
        "editable" => false
      )
      expect(payload.dig("user", "display_name")).to eq("Rau Studio")
    end
  end

  describe "GET /:username/radio/status.json" do
    it "normalizes and exposes the current Icecast metadata" do
      status = {
        online: true,
        server_name: "Rau Studio Radio",
        title: "Artista — Canción",
        listeners: 2,
        listenurl: "http://localhost:8000/live.mp3"
      }
      fetcher = instance_double(Icecast::StatusFetcher, call: status)
      allow(Icecast::StatusFetcher).to receive(:new).with(artist.radio_stream_url).and_return(fetcher)

      get "/#{artist.username}/radio/status.json"

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to include(
        "configured" => true,
        "online" => true,
        "server_name" => "Rau Studio Radio",
        "title" => "Artista — Canción",
        "listeners" => 2
      )
    end

    it "reports an offline signal without exposing backend details" do
      allow(Icecast::StatusFetcher).to receive(:new)
        .and_raise(Icecast::StatusFetcher::Unavailable, "connection refused")

      get "/#{artist.username}/radio/status.json"

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to eq(
        "configured" => true,
        "online" => false,
        "error" => "signal_unavailable"
      )
    end
  end
end
