require "rails_helper"

RSpec.describe "Event link previews", type: :request do
  let(:event) do
    create(:event, state: "published", title: 'Festival "Música & amigos"', description: "Una noche de música en vivo.")
  end

  def document
    Nokogiri::HTML(response.body)
  end

  def meta_content(name)
    document.at_css("head meta[name='#{name}'], head meta[property='#{name}']")&.[]("content")
  end

  def attach_cover
    event.cover.attach(
      io: File.open(Rails.root.join("spec/fixtures/files/sample.jpg")),
      filename: "event-cover.png",
      content_type: "image/png"
    )
  end

  %w[default custom].each do |site_mode|
    it "renders #{site_mode} event metadata for crawlers without JavaScript" do
      event.update!(site_mode: site_mode)
      attach_cover

      get event_path(event), params: { utm_source: "share", ticket_token: "secret-ticket" },
        headers: { "User-Agent" => "facebookexternalhit/1.1" }

      expect(response).to have_http_status(:ok)
      expect(document.css("head title").size).to eq(1)
      expect(document.at_css("head title").text).to include(event.title)
      expect(meta_content("description")).to eq(event.description)
      expect(meta_content("og:title")).to eq(event.title)
      expect(meta_content("og:description")).to eq(event.description)
      expect(meta_content("og:type")).to eq("website")
      expect(meta_content("og:site_name")).to eq("Rauversion")
      expect(meta_content("og:image")).to match(%r{\Ahttp://www.example.com/rails/active_storage/blobs/redirect/.+/event-cover.png\z})
      expect(meta_content("image")).to eq(meta_content("og:image"))
      expect(meta_content("og:image:alt")).to eq(event.title)
      expect(meta_content("twitter:card")).to eq("summary_large_image")
      expect(meta_content("twitter:title")).to eq(event.title)
      expect(meta_content("twitter:description")).to eq(event.description)
      expect(meta_content("twitter:image")).to eq(meta_content("og:image"))
      expect(meta_content("twitter:image:alt")).to eq(event.title)
      expect(meta_content("og:url")).to eq("http://www.example.com#{event_path(event)}")
      expect(document.at_css("head link[rel='canonical']")["href"]).to eq(meta_content("og:url"))
    end
  end

  it "serves the preview image without authentication" do
    attach_cover
    get event_path(event)
    image_url = meta_content("og:image")

    get URI.parse(image_url).request_uri

    expect(response).to have_http_status(:redirect)
    follow_redirect!
    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq("image/png")
  end

  it "provides an absolute fallback image and uses the title when the description is empty" do
    event.update!(description: " \n ")

    get event_path(event)

    expect(response).to have_http_status(:ok)
    expect(meta_content("description")).to eq(event.title)
    expect(meta_content("og:description")).to eq(event.title)
    expect(meta_content("og:image")).to eq("http://www.example.com/images/default-sq3.jpg")
    expect(meta_content("twitter:image")).to eq(meta_content("og:image"))
  end

  it "cleans and limits legacy descriptions consistently across all tags" do
    event.update!(description: "<p>#{'Música &amp; baile ' * 100}</p>")

    get event_path(event)

    expect(meta_content("description").length).to be <= 160
    expect(meta_content("description")).to start_with("Música & baile")
    expect(meta_content("description")).not_to include("<p>", "&amp;", "\n")
    expect(meta_content("og:description")).to eq(meta_content("description"))
    expect(meta_content("twitter:description")).to eq(meta_content("description"))
  end

  it "uses the plain text of Tiptap descriptions" do
    event.update!(description_document: { type: "doc", content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Música & baile", marks: [{ type: "bold" }] }] },
      { type: "paragraph", content: [{ type: "text", text: "En vivo" }] }
    ] })

    get event_path(event)

    expect(meta_content("description")).to eq("Música & baile En vivo")
    expect(meta_content("og:description")).to eq(meta_content("description"))
    expect(meta_content("twitter:description")).to eq(meta_content("description"))
  end

  it "returns the same metadata for client navigation, without JSON or tracking parameters in the canonical URL" do
    attach_cover
    get event_path(event)
    expected = {
      "title" => meta_content("og:title"),
      "document_title" => document.at_css("head title").text,
      "description" => meta_content("description"),
      "image" => meta_content("og:image"),
      "image_alt" => meta_content("og:image:alt"),
      "url" => meta_content("og:url"),
      "type" => meta_content("og:type")
    }

    get event_path(event, format: :json), params: { utm_source: "share" }

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).fetch("seo")).to eq(expected)
  end

  it "preserves the signed access link in private event metadata" do
    event.update!(visibility: "private")
    access_id = event.signed_id(expires_in: 30.days, purpose: :private_event)

    get event_path(access_id), params: { utm_source: "share" }

    expect(response).to have_http_status(:ok)
    expect(meta_content("og:url")).to eq("http://www.example.com#{event_path(access_id)}")
    expect(document.at_css("head link[rel='canonical']")["href"]).to eq(meta_content("og:url"))

    get event_path(access_id, format: :json)

    expect(JSON.parse(response.body).dig("seo", "url")).to eq("http://www.example.com#{event_path(access_id)}")
  end

  it "does not expose draft event metadata through signed links" do
    event.update!(state: "draft", visibility: "private")
    access_id = event.signed_id(expires_in: 30.days, purpose: :private_event)

    get event_path(access_id)

    expect(response).to redirect_to(events_path)
    expect(meta_content("og:title")).to be_nil
    expect(response.body).not_to include(event.title)
  end
end
