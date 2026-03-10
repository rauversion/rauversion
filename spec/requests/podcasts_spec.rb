require 'rails_helper'

RSpec.describe "Podcasts", type: :request do
  describe "GET /:username/podcasts/:id.json" do
    let(:user) { create(:user, confirmed_at: Time.current) }
    let!(:podcaster_info) do
      create(
        :podcaster_info,
        user: user,
        active: true,
        title: "Raucasts",
        description: "Conversaciones sobre musica",
        about: "Podcast oficial"
      )
    end
    let!(:track) do
      create(
        :track,
        user: user,
        podcast: true,
        private: false,
        state: "processed",
        description: "Episodio piloto"
      )
    end

    before do
      track.cover.attach(
        io: File.open(Rails.root.join("spec/fixtures/files/sample.jpg")),
        filename: "sample.jpg",
        content_type: "image/jpeg"
      )

      track.mp3_audio.attach(
        io: File.open(Rails.root.join("spec/fixtures/audio.mp3")),
        filename: "audio.mp3",
        content_type: "audio/mpeg"
      )
    end

    it "returns the episode image url for the show payload" do
      get "/#{user.username}/podcasts/#{track.slug}.json"

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body)

      expect(payload["id"]).to eq(track.id)
      expect(payload["user_id"]).to eq(user.id)
      expect(payload["image_url"]).to be_present
      expect(payload["cover_url"]).to be_present
      expect(payload["audio_url"]).to be_present
    end
  end
end
