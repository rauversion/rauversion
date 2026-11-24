require "rails_helper"

RSpec.describe "Oembeds", type: :request do
  describe "GET /oembed" do
    let(:id) { "2124923354742501719" }
    let(:url) { "https://x.com/anukarimusic/status/#{id}?a=F3oDTSz8xXuDgLnf2iI&s=20" }
    let(:http) { double("X HTTP client") }
    let(:poster) { "https://pbs.twimg.com/amplify_video_thumb/123/img/poster.jpg" }
    let(:mp4) { "https://video.twimg.com/amplify_video/123/vid/high.mp4" }

    before do
      allow(XPostMetadata).to receive(:new).and_return(XPostMetadata.new(http: http))
    end

    it "adds a playable video and its poster to a previously cached X card" do
      card = PreviewCard.create!(url: url, html: '<blockquote class="twitter-tweet"></blockquote>')
      expect(http).to receive(:get).with(XPostMetadata::SYNDICATION_URL, params: {id: id, lang: "en", token: id}).once.and_return(
        provider_response(200, {
          id_str: id,
          text: "A video from Anukari",
          user: {screen_name: "anukarimusic", name: "Anukari"},
          mediaDetails: [{
            type: "video", media_url_https: poster, original_info: {width: 1656, height: 2070},
            video_info: {variants: [
              {content_type: "application/x-mpegURL", url: "https://video.twimg.com/amplify_video/123/pl/master.m3u8"},
              {content_type: "video/mp4", bitrate: 500_000, url: "https://video.twimg.com/amplify_video/123/vid/low.mp4"},
              {content_type: "video/mp4", bitrate: 900_000, url: mp4}
            ]}
          }]
        })
      )

      2.times do
        get oembed_path, params: {url: url}

        expect(response).to have_http_status(:ok)
        body = response.parsed_body
        expect(body).to include("title" => "Anukari", "description" => "A video from Anukari")
        expect(body["images"]).to eq([{"url" => poster, "width" => 1656, "height" => 2070}])
        expect(body.dig("media", "videos").first).to include("url" => mp4, "poster_url" => poster, "content_type" => "video/mp4")
        video = Nokogiri::HTML.fragment(body.dig("media", "html")).at_css("video")
        expect(video["poster"]).to eq(poster)
        expect(video.at_css("source")["src"]).to eq(mp4)
      end

      expect(card.reload.html).to include(mp4, poster)
    end

    it "returns the photos from legacy Twitter URLs with an attachment suffix" do
      photos = %w[first second].map { |name| "https://pbs.twimg.com/media/#{name}.jpg" }
      allow(http).to receive(:get).with(XPostMetadata::SYNDICATION_URL, params: {id: id, lang: "en", token: id}).and_return(
        provider_response(200, {id_str: id, mediaDetails: photos.map { |photo| {type: "photo", media_url_https: photo} }})
      )

      get oembed_path, params: {url: "https://mobile.twitter.com/anukarimusic/status/#{id}/photo/2?s=20"}

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["images"]).to eq(photos.map { |photo| {"url" => photo} })
      expect(response.parsed_body.dig("media", "videos")).to be_empty
    end

    it "keeps the oEmbed fallback usable and retries missing media on the next request" do
      fallback = '<blockquote class="twitter-tweet">Some text</blockquote>'
      expect(http).to receive(:get).with(XPostMetadata::SYNDICATION_URL, params: {id: id, lang: "en", token: id}).twice.and_return(
        provider_response(429, {}),
        provider_response(200, {id_str: id, text: "Some text"})
      )
      expect(http).to receive(:get).with(XPostMetadata::OEMBED_URL, params: {url: "https://x.com/i/status/#{id}"}).once.and_return(
        provider_response(200, {author_name: "Anukari", html: fallback})
      )

      get oembed_path, params: {url: url}
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["html"]).to eq(fallback)

      2.times do
        get oembed_path, params: {url: url}
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["images"]).to be_empty
        expect(response.parsed_body.dig("media", "videos")).to be_empty
      end
    end

    def provider_response(code, payload)
      double("X HTTP response", code: code, to_s: payload.to_json)
    end
  end
end
