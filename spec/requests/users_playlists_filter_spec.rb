require "rails_helper"

RSpec.describe "Users playlists filter", type: :request do
  describe "GET /:username/playlists_filter.json" do
    let(:artist) do
      create(
        :user,
        role: :artist,
        username: "artist-filter",
        confirmed_at: Time.current
      )
    end
    let(:label_curator) do
      create(
        :user,
        role: :artist,
        username: "label-curator",
        confirmed_at: Time.current
      )
    end

    let!(:public_album) do
      create(
        :playlist,
        user: artist,
        title: "Owned album",
        playlist_type: "album",
        private: nil
      )
    end
    let!(:label_album) do
      create(
        :playlist,
        user: label_curator,
        label: artist,
        title: "Label album",
        playlist_type: "album",
        private: false
      )
    end
    let!(:public_playlist) do
      create(
        :playlist,
        user: artist,
        title: "Owned playlist",
        playlist_type: "playlist",
        private: false
      )
    end
    let!(:label_playlist) do
      create(
        :playlist,
        user: label_curator,
        label: artist,
        title: "Label playlist",
        playlist_type: "playlist",
        private: false
      )
    end
    let!(:private_album) do
      create(
        :playlist,
        user: artist,
        title: "Private album",
        playlist_type: "album",
        private: true
      )
    end

    it "filters album results across owned and labeled playlists" do
      get "/#{artist.username}/playlists_filter.json", params: { kind: "album" }

      expect(response).to have_http_status(:ok)
      expect(parsed_collection.map { |playlist| playlist["slug"] })
        .to contain_exactly(public_album.slug, label_album.slug)
      expect(parsed_collection.map { |playlist| playlist["playlist_type"] }.uniq)
        .to eq(["album"])
    end

    it "includes the owner's private albums when signed in" do
      sign_in artist

      get "/#{artist.username}/playlists_filter.json", params: { kind: "album" }

      expect(response).to have_http_status(:ok)
      expect(parsed_collection.map { |playlist| playlist["slug"] }).to include(private_album.slug)
    end

    def parsed_collection
      JSON.parse(response.body).fetch("collection")
    end
  end
end
