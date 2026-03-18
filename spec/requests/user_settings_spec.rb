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
end
