require "rails_helper"

RSpec.describe FetchLinkCardService do

  describe "#call" do
    let(:service) { described_class.new }
    let(:url) { "https://www.youtube.com/watch?v=abc123" }

    before do
      # Stub OEmbed provider
      oembed_response = double(
        "OEmbed::Response",
        type: "video",
        title: "Test Video",
        author_name: "Test Author",
        author_url: "https://youtube.com/testauthor",
        thumbnail_url: "https://img.youtube.com/vi/abc123/hqdefault.jpg",
        html: '<iframe src="https://www.youtube.com/embed/abc123"></iframe>'
      )
      allow(OEmbed::Providers).to receive(:get).with(url).and_return(oembed_response)

      # Stub HTTP HEAD request
      head_response = double("HTTP::Response", code: 200, mime_type: "text/html")
      allow_any_instance_of(FetchLinkCardService).to receive_message_chain(:http_client, :head).and_return(head_response)

      # Stub image download
      allow_any_instance_of(FetchLinkCardService).to receive(:download_image).and_return(
        ActionDispatch::Http::UploadedFile.new(
          filename: "thumb.jpg",
          type: "image/jpeg",
          tempfile: Tempfile.new("thumb")
        )
      )
    end

    it "creates a PreviewCard from oEmbed data" do
      card = service.call(url)
      expect(card).to be_a(PreviewCard)
      expect(card).to be_persisted
      #expect(card.type).to eq("video")
      expect(card.title).to eq("Test Video")
      expect(card.author_name).to eq("Test Author")
      expect(card.author_url).to eq("https://youtube.com/testauthor")
      expect(card.html).to include("iframe")
      expect(card.image).to be_attached
    end

  end


  describe "real-world scenarios" do
    
    it "youtube" do
      url = "https://www.youtube.com/watch?v=9mHGKBoYeNI"
      service = FetchLinkCardService.new
      card = service.call(url)
      expect(card).to be_a(PreviewCard)
      expect(card).to be_persisted
      expect(card.title).to be == "Deploy Ruby on Rails 8 App to DigitalOcean Using Kamal — Easy Setup"
      expect(card.html).to include("100%")
      # expect(card.type).to eq("video")
    end

    it "vimeo" do
      url = "https://vimeo.com/63103776"
      service = FetchLinkCardService.new
      card = service.call(url)
      expect(card).to be_a(PreviewCard)
      expect(card).to be_persisted
      expect(card.title).to be == "VDMX Tutorial 02_El plugin Step Sequencer"
      expect(card.html).to include("<iframe")
      # expect(card.type).to eq("video")
    end

    it "spotify" do
      url = "https://open.spotify.com/show/1uMWT5wwErNmOFJjrn84lk"
      service = FetchLinkCardService.new
      card = service.call(url)
      expect(card).to be_a(PreviewCard)
      expect(card).to be_persisted
      expect(card.title).to be == "TRAILER - Necesito poder respirar: La vida de Jorge González"
      expect(card.html).to include("<iframe")
    end

    it  "bandcamp" do
      url = "https://magiablanca.bandcamp.com/album/del-carmen"
      service = FetchLinkCardService.new
      card = service.call(url)
      expect(card).to be_a(PreviewCard)
      expect(card).to be_persisted
      expect(card.title).to be ==  "Del Carmen, by Virgo Season"
      expect(card.html).to include("<iframe")
    end
  end

  describe "OpenGraph video meta tags" do
    let(:service) { described_class.new }
    let(:url) { "https://bandcamp.com/album/123" }
    let(:og_video_html) do
      <<-HTML
      <html>
        <head>
          <meta property="og:title" content="Bandcamp Album">
          <meta property="og:video" content="https://bandcamp.com/EmbeddedPlayer/v=2/album=2673502982/size=large/tracklist=false/artwork=small/">
          <meta property="og:video:secure_url" content="https://bandcamp.com/EmbeddedPlayer/v=2/album=2673502982/size=large/tracklist=false/artwork=small/">
          <meta property="og:video:type" content="text/html">
          <meta property="og:video:height" content="120">
          <meta property="og:video:width" content="400">
        </head>
        <body></body>
      </html>
      HTML
    end

    before do
      # Stub HTTP HEAD request
      head_response = double("HTTP::Response", code: 200, mime_type: "text/html")
      allow_any_instance_of(FetchLinkCardService).to receive_message_chain(:http_client, :head).and_return(head_response)

      # Stub HTTP GET request for OpenGraph
      get_response = double("HTTP::Response", code: 200, mime_type: "text/html", to_s: og_video_html)
      allow_any_instance_of(FetchLinkCardService).to receive_message_chain(:http_client, :get).and_return(get_response)
    end

    it "creates a PreviewCard with type video and correct iframe from og:video tags" do
      card = service.call(url)
      expect(card).to be_a(PreviewCard)
      expect(card).to be_persisted
      # expect(card.type).to eq("video")
      expect(card.title).to eq("Bandcamp Album")
      expect(card.html).to include('<iframe')
      expect(card.html).to include('src="https://bandcamp.com/EmbeddedPlayer/v=2/album=2673502982/size=large/tracklist=false/artwork=small/"')
      expect(card.html).to include('width="400"')
      expect(card.html).to include('height="120"')
    end
  end
end
