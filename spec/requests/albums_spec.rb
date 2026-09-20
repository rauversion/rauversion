require 'rails_helper'

RSpec.describe "Albums", type: :request do
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

  it "renders album metadata in the HTML head without JavaScript" do
    attach_cover(release, "release-cover.jpg")
    attach_cover(release.playlist, "playlist-cover.jpg")

    get album_path(release), params: { utm_source: "share" }

    expect(response).to have_http_status(:ok)
    document = Nokogiri::HTML(response.body)
    expect(document.at_css("title").text).to include(release.title)
    expect(meta_content("description")).to eq("Música para bailar")
    expect(meta_content("og:title")).to eq(release.title)
    expect(meta_content("og:description")).to eq(meta_content("description"))
    expect(meta_content("og:type")).to eq("music.album")
    expect(meta_content("og:image")).to match(%r{\Ahttps?://.+/release-cover.jpg\z})
    expect(meta_content("image")).to eq(meta_content("og:image"))
    expect(meta_content("twitter:card")).to eq("summary_large_image")
    expect(meta_content("twitter:title")).to eq(release.title)
    expect(meta_content("twitter:description")).to eq(meta_content("description"))
    expect(meta_content("twitter:image")).to eq(meta_content("og:image"))
    expect(meta_content("og:url")).to end_with(album_path(release))
    expect(document.at_css("link[rel='canonical']")["href"]).to eq(meta_content("og:url"))
  end

  it "uses the playlist description and cover when the release has neither" do
    release.update!(subtitle: " ")
    release.playlist.update!(description: "<p>Disco <strong>nuevo</strong> &amp; música.</p>")
    attach_cover(release.playlist, "playlist-cover.jpg")

    get album_path(release)

    expect(meta_content("description")).to eq("Disco nuevo & música.")
    expect(meta_content("og:image")).to end_with("/playlist-cover.jpg")
  end

  it "provides a description and absolute default image when metadata is missing" do
    release.update!(subtitle: "<p></p>")
    release.playlist.update!(description: nil)

    get album_path(release)

    expect(response).to have_http_status(:ok)
    expect(meta_content("description")).to eq("Listen to Días perfectos on Rauversion.")
    expect(meta_content("og:image")).to match(%r{\Ahttps?://.+/images/default-sq3.jpg\z})
  end

  it "limits long descriptions in both standard and social tags" do
    release.update!(subtitle: "Música " * 100)

    get album_path(release)

    expect(meta_content("description").length).to be <= 160
    expect(meta_content("og:description")).to eq(meta_content("description"))
    expect(meta_content("twitter:description")).to eq(meta_content("description"))
  end

  it "returns the same metadata for client-side navigation" do
    get album_path(release)
    expected = {
      "title" => meta_content("og:title"),
      "document_title" => Nokogiri::HTML(response.body).at_css("title").text,
      "description" => meta_content("description"),
      "image" => meta_content("og:image"),
      "url" => meta_content("og:url"),
      "type" => meta_content("og:type")
    }

    get album_path(release, format: :json)

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).fetch("seo")).to include(expected)
  end

  it "provides localized metadata for the album directory" do
    get albums_path, params: { locale: "es" }

    expect(response).to have_http_status(:ok)
    expect(meta_content("og:title")).to eq("Álbumes")
    expect(meta_content("description")).to eq("Explora los últimos lanzamientos de la comunidad")
    expect(meta_content("og:type")).to eq("website")
    expect(meta_content("og:image")).to match(%r{\Ahttps?://.+/images/default-sq3.jpg\z})

    get albums_path(format: :json), params: { locale: "es" }

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).dig("seo", "title")).to eq("Álbumes")
  end
end
