require 'rails_helper'

RSpec.describe "Releases", type: :request do
  let(:release) { create(:release, title: "Días perfectos", subtitle: "Música para bailar") }

  def meta_content(name)
    document = Nokogiri::HTML(response.body)
    document.at_css("meta[name='#{name}'], meta[property='#{name}']")&.[]("content")
  end

  def attach_cover(record, filename)
    record.cover.attach(
      io: File.open(Rails.root.join("spec/fixtures/files/sample.jpg")),
      filename: filename,
      content_type: "image/jpeg"
    )
  end

  it "renders title, description and cover in the HTML head without JavaScript" do
    attach_cover(release, "release-cover.jpg")
    attach_cover(release.playlist, "playlist-cover.jpg")

    get release_path(release), params: { utm_source: "share" }

    expect(response).to have_http_status(:ok)
    document = Nokogiri::HTML(response.body)
    expect(document.at_css("head title").text).to include(release.title)
    expect(meta_content("description")).to eq("Música para bailar")
    expect(meta_content("og:title")).to eq(release.title)
    expect(meta_content("og:description")).to eq(meta_content("description"))
    expect(meta_content("og:type")).to eq("music.album")
    expect(meta_content("og:site_name")).to eq("Rauversion")
    expect(meta_content("og:image")).to match(%r{\Ahttps?://.+/release-cover.jpg\z})
    expect(meta_content("image")).to eq(meta_content("og:image"))
    expect(meta_content("twitter:card")).to eq("summary_large_image")
    expect(meta_content("twitter:title")).to eq(release.title)
    expect(meta_content("twitter:description")).to eq(meta_content("description"))
    expect(meta_content("twitter:image")).to eq(meta_content("og:image"))
    expect(meta_content("og:url")).to eq("http://www.example.com#{release_path(release)}")
    expect(document.at_css("link[rel='canonical']")["href"]).to eq(meta_content("og:url"))
  end

  it "falls back to the playlist description and cover" do
    release.update!(subtitle: "<p> </p>")
    release.playlist.update!(description: "<p>Disco <strong>nuevo</strong> &amp; música.</p>")
    attach_cover(release.playlist, "playlist-cover.jpg")

    get release_path(release)

    expect(meta_content("description")).to eq("Disco nuevo & música.")
    expect(meta_content("og:image")).to end_with("/playlist-cover.jpg")
  end

  it "provides an absolute default image and description when neither has metadata" do
    release.update!(subtitle: nil)
    release.playlist.update!(description: nil)

    get release_path(release)

    expect(response).to have_http_status(:ok)
    expect(meta_content("description")).to eq("Listen to Días perfectos on Rauversion.")
    expect(meta_content("og:image")).to eq("http://www.example.com/images/default-sq3.jpg")
  end

  it "cleans and limits the description in all tags" do
    release.update!(subtitle: "<p>#{'Música &amp; baile ' * 100}</p>")

    get release_path(release)

    expect(meta_content("description").length).to be <= 160
    expect(meta_content("description")).to start_with("Música & baile")
    expect(meta_content("description")).not_to include("<p>", "&amp;")
    expect(meta_content("og:description")).to eq(meta_content("description"))
    expect(meta_content("twitter:description")).to eq(meta_content("description"))
  end

  it "includes metadata on previews and uses the public release as the canonical URL" do
    [preview_release_path(release), "#{preview_release_path(release)}/page-2"].each do |path|
      get path

      expect(response).to have_http_status(:ok)
      expect(meta_content("og:title")).to eq(release.title)
      expect(meta_content("og:description")).to eq("Música para bailar")
      expect(meta_content("og:url")).to eq("http://www.example.com#{release_path(release)}")
    end
  end

  it "returns the same metadata from both JSON endpoints used by client navigation" do
    attach_cover(release, "release-cover.jpg")
    get release_path(release)
    expected = {
      "title" => meta_content("og:title"),
      "document_title" => Nokogiri::HTML(response.body).at_css("title").text,
      "description" => meta_content("description"),
      "image" => meta_content("og:image"),
      "url" => meta_content("og:url"),
      "type" => meta_content("og:type")
    }

    [release_path(release, format: :json), preview_release_path(release, format: :json)].each do |path|
      get path

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).fetch("seo")).to include(expected)
    end
  end
end
