require "rails_helper"

RSpec.describe "Artists directory", type: :request do
  describe "GET /artists.json" do
    let!(:artist) do
      create(
        :user,
        role: :artist,
        username: "synth-hero",
        first_name: "Synth",
        last_name: "Hero",
        city: "Santiago",
        country: "Chile",
        bio: "Analog textures and club-focused live sets.",
        featured: true,
        confirmed_at: Time.current
      )
    end
    let!(:other_artist) do
      create(
        :user,
        role: :artist,
        username: "drum-machine",
        first_name: "Drum",
        last_name: "Machine",
        confirmed_at: Time.current
      )
    end
    let!(:listener) { create(:user, confirmed_at: Time.current) }
    let!(:public_track) { create(:track, user: artist, private: false) }
    let!(:private_track) { create(:track, user: artist, private: true) }
    let!(:follow) do
      Follow.create!(
        follower_type: "User",
        follower_id: listener.id,
        followable_type: "User",
        followable_id: artist.id
      )
    end

    before do
      attach_image(artist, :avatar)
      attach_image(other_artist, :avatar)
    end

    it "returns profile details and public stats for artist cards" do
      get "/artists.json"

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body)
      artist_payload = payload.fetch("collection").find { |item| item["id"] == artist.id }

      expect(artist_payload["username"]).to eq("synth-hero")
      expect(artist_payload["display_name"]).to eq("synth-hero")
      expect(artist_payload["full_name"]).to eq("Synth Hero")
      expect(artist_payload["city"]).to eq("Santiago")
      expect(artist_payload["country"]).to eq("Chile")
      expect(artist_payload["bio"]).to eq("Analog textures and club-focused live sets.")
      expect(artist_payload["featured"]).to eq(true)
      expect(artist_payload["tracks_count"]).to eq(1)
      expect(artist_payload["followers_count"]).to eq(1)
      expect(artist_payload.dig("avatar_url", "medium")).to be_present
    end

    def attach_image(record, attachment_name)
      record.public_send(attachment_name).attach(
        io: File.open(Rails.root.join("spec/fixtures/files/sample.jpg")),
        filename: "sample.jpg",
        content_type: "image/jpeg"
      )
    end
  end
end
