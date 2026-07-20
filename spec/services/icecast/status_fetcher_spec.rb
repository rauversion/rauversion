require "rails_helper"

RSpec.describe Icecast::StatusFetcher do
  subject(:fetcher) { described_class.new("http://radio.example.com:8000/live.mp3") }

  let(:http) { double("Net::HTTP") }
  let(:response) { double("Net::HTTPResponse", code: "200", body: response_body) }
  let(:response_body) do
    {
      icestats: {
        source: {
          server_name: "Rau Studio Radio",
          title: "Artista — Canción",
          listeners: 2,
          listenurl: "http://radio.example.com:8000/live.mp3"
        }
      }
    }.to_json
  end

  before do
    allow(Resolv).to receive(:getaddresses).with("radio.example.com").and_return(["203.0.113.10"])
    allow(Net::HTTP).to receive(:new).with("radio.example.com", 8000).and_return(http)
    allow(http).to receive(:use_ssl=).with(false)
    allow(http).to receive(:open_timeout=).with(2)
    allow(http).to receive(:read_timeout=).with(3)
    allow(http).to receive(:start).and_yield(http)
    allow(http).to receive(:request).and_return(response)
  end

  it "fetches status-json.xsl and normalizes the active source" do
    expect(fetcher.call).to eq(
      online: true,
      server_name: "Rau Studio Radio",
      title: "Artista — Canción",
      listeners: 2,
      listenurl: "http://radio.example.com:8000/live.mp3"
    )

    expect(http).to have_received(:request) do |request|
      expect(request).to be_a(Net::HTTP::Get)
      expect(request.path).to eq("/status-json.xsl")
      expect(request["Accept"]).to eq("application/json")
    end
  end

  context "when the stream mount is inside a nested path" do
    subject(:fetcher) do
      described_class.new(
        "https://broadcast.rauversion.com/radio/72632e733e18978240ce4443/radio.mp3"
      )
    end

    let(:http) { double("Net::HTTP") }
    let(:response_body) do
      {
        icestats: {
          source: {
            server_name: "Rau Studio Radio",
            title: "Artista — Canción",
            listeners: 2,
            listenurl: "https://broadcast.rauversion.com/radio/72632e733e18978240ce4443/radio.mp3"
          }
        }
      }.to_json
    end

    before do
      allow(Resolv).to receive(:getaddresses)
        .with("broadcast.rauversion.com")
        .and_return(["203.0.113.11"])
      allow(Net::HTTP).to receive(:new)
        .with("broadcast.rauversion.com", 443)
        .and_return(http)
      allow(http).to receive(:use_ssl=).with(true)
      allow(http).to receive(:open_timeout=).with(2)
      allow(http).to receive(:read_timeout=).with(3)
      allow(http).to receive(:start).and_yield(http)
      allow(http).to receive(:request).and_return(response)
    end

    it "keeps status-json.xsl beside the configured stream mount" do
      fetcher.call

      expect(http).to have_received(:request) do |request|
        expect(request.path).to eq("/radio/72632e733e18978240ce4443/status-json.xsl")
      end
    end
  end

  context "when Icecast returns several mounts" do
    let(:response_body) do
      {
        icestats: {
          source: [
            { title: "Other show", listeners: 9, listenurl: "http://radio.example.com:8000/other.mp3" },
            { title: "Selected show", listeners: 4, listenurl: "http://radio.example.com:8000/live.mp3" }
          ]
        }
      }.to_json
    end

    it "selects the source matching the configured mount" do
      expect(fetcher.call).to include(title: "Selected show", listeners: 4)
    end
  end

  context "when no source is broadcasting" do
    let(:response_body) { { icestats: { source: nil } }.to_json }

    it "returns an offline status" do
      expect(fetcher.call).to eq(
        online: false,
        server_name: nil,
        title: nil,
        listeners: 0,
        listenurl: nil
      )
    end
  end

  context "when Icecast returns HTML entities in its metadata" do
    let(:response_body) do
      {
        icestats: {
          source: {
            server_name: "Rau &amp; Studio Radio",
            title: "Borne &#8725;Scrufizzer &#8212; Original Style",
            listeners: 2,
            listenurl: "http://radio.example.com:8000/live.mp3"
          }
        }
      }.to_json
    end

    it "decodes the station name and now-playing title as plain text" do
      expect(fetcher.call).to include(
        server_name: "Rau & Studio Radio",
        title: "Borne ∕Scrufizzer — Original Style"
      )
    end
  end

  it "rejects invalid JSON responses" do
    allow(response).to receive(:body).and_return("not-json")

    expect { fetcher.call }.to raise_error(described_class::InvalidResponse)
  end

  it "rejects stream URLs outside HTTP and HTTPS" do
    expect { described_class.new("ftp://radio.example.com/live.mp3") }
      .to raise_error(described_class::InvalidUrl)
  end
end
