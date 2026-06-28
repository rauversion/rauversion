require "rails_helper"

RSpec.describe "Users", type: :request do
  describe "profile tracks and mixes" do
    let(:artist) { create(:user, username: "profile-artist", confirmed_at: Time.current) }
    let!(:music_track) { create(:track, user: artist, title: "Original track") }
    let!(:dj_set) { create(:track, user: artist, title: "Club mix", dj_set: true) }

    it "separates music tracks from DJ sets" do
      get user_tracks_path(artist.username, format: :json)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).fetch("collection").pluck("id")).to eq([music_track.id])

      get user_mixes_path(artist.username, format: :json)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).fetch("collection").pluck("id")).to eq([dj_set.id])
    end
  end

  describe "omniauth" do
    before(:each) do
      OmniAuth.config.test_mode = true
    end

    after(:each) do
      OmniAuth.config.test_mode = false
      OmniAuth.config.mock_auth[:twitter] = nil
      OmniAuth.config.mock_auth[:discord] = nil
    end

    let(:user) { FactoryBot.create(:user) }

    # it "should sign in with twitter" do
    #   omni_params = oauth2_mock(:twitter)
    #   user.oauth_credentials.create(provider: omni_params.provider, uid: omni_params.uid)

    #   expect {
    #     post user_twitter_omniauth_callback_url, env: {"omniauth.auth": omni_params}
    #   }.to change(User, :count).by(0)
    #   expect(response).to redirect_to(new_user_session_path)
    #   expect(flash[:notice]).to include("We are synchronizing your twitter data")
    # end

    # it "should sign in with discord" do
    #   omni_params = oauth2_mock(:discord)
    #   user.oauth_credentials.create(provider: omni_params.provider, uid: omni_params.uid)
# 
    #   expect {
    #     post user_discord_omniauth_callback_url, env: {"omniauth.auth": omni_params}
    #   }.to change(User, :count).by(0)
    #   expect(response).to redirect_to(new_user_session_path)
    #   expect(flash[:notice]).to include("We are synchronizing your discord data")
    # end
  end
end
