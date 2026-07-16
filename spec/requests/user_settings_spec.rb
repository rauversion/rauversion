require "rails_helper"

RSpec.describe "UserSettings", type: :request do
  let(:user) do
    create(
      :user,
      confirmed_at: Time.current,
      username: "settings-user",
      display_name: "Settings Artist"
    )
  end

  before do
    sign_in user
  end

  describe "GET /:username/settings.json" do
    it "returns the current display_name" do
      get "/#{user.username}/settings.json"

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body)

      expect(payload.dig("user", "display_name")).to eq("Settings Artist")
      expect(payload.dig("user", "username")).to eq("settings-user")
      expect(payload.fetch("menu_items").pluck("namespace")).to include("radio")
    end
  end

  describe "PATCH /:username/settings/profile.json" do
    it "updates the display_name independently from the username" do
      patch "/#{user.username}/settings/profile.json",
        params: {
          user: {
            display_name: "Public Artist",
            username: user.username
          }
        },
        as: :json

      expect(response).to have_http_status(:ok)
      expect(user.reload.display_name).to eq("Public Artist")
      expect(user.username).to eq("settings-user")
    end
  end


  describe "PATCH /:username/settings/radio.json" do
    it "connects an Icecast live stream without changing other profile data" do
      patch "/#{user.username}/settings/radio.json",
        params: {
          user: {
            radio_stream_url: "http://127.0.0.1:8000/live.mp3"
          }
        },
        as: :json

      expect(response).to have_http_status(:ok)
      expect(user.reload.radio_stream_url).to eq("http://127.0.0.1:8000/live.mp3")
      expect(JSON.parse(response.body).dig("user", "radio_stream_url")).to eq("http://127.0.0.1:8000/live.mp3")
    end

    it "returns validation errors for an unsupported stream URL" do
      patch "/#{user.username}/settings/radio.json",
        params: { user: { radio_stream_url: "javascript:alert(1)" } },
        as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body).dig("errors", "radio_stream_url")).to be_present
    end
  end
end
