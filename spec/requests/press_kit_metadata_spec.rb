require "rails_helper"

RSpec.describe "Press kit link previews", type: :request do
  let(:user) { create(:user, username: "previewartist", confirmed_at: Time.current) }
  let(:kit) do
    user.create_press_kit!(data: {
      published: true,
      artistName: "Música & amigos",
      tagline: "Electronic producer",
      bio: { intro: "Una noche de música en vivo." }
    })
  end

  def document
    Nokogiri::HTML(response.body)
  end

  def meta_content(name)
    document.at_css("head meta[name='#{name}'], head meta[property='#{name}']")&.[]("content")
  end

  def attach_image(attachment, filename: "press.png")
    attachment.attach(
      io: File.open(Rails.root.join("spec/fixtures/files/sample.jpg")),
      filename: filename,
      content_type: "image/png"
    )
  end

  def add_photo(press_kit = kit, filename: "press.png")
    press_kit.photos.create!(user: press_kit.user).tap do |photo|
      attach_image(photo.image, filename: filename)
    end
  end

  it "renders social tags and the selected original cover without JavaScript" do
    add_photo
    cover = add_photo(filename: "selected-cover.png")
    kit.update!(data: kit.data.merge("heroPhotoId" => cover.id.to_s))

    get "/#{user.username}/press-kit", params: { edit: "1", utm_source: "share" },
      headers: { "User-Agent" => "facebookexternalhit/1.1" }

    expect(response).to have_http_status(:ok)
    expect(document.css("head title").size).to eq(1)
    expect(document.at_css("head title").text).to include("Música & amigos — Press Kit")
    expect(meta_content("description")).to eq("Una noche de música en vivo.")
    expect(meta_content("og:title")).to eq("Música & amigos — Press Kit")
    expect(meta_content("og:description")).to eq(meta_content("description"))
    expect(meta_content("og:type")).to eq("website")
    expect(meta_content("og:site_name")).to eq("Rauversion")
    expect(meta_content("og:image")).to match(%r{\Ahttp://www.example.com/rails/active_storage/blobs/redirect/.+/selected-cover.png\z})
    expect(meta_content("image")).to eq(meta_content("og:image"))
    expect(meta_content("og:image:alt")).to eq("Música & amigos")
    expect(meta_content("twitter:card")).to eq("summary_large_image")
    expect(meta_content("twitter:title")).to eq(meta_content("og:title"))
    expect(meta_content("twitter:description")).to eq(meta_content("description"))
    expect(meta_content("twitter:image")).to eq(meta_content("og:image"))
    expect(meta_content("twitter:image:alt")).to eq("Música & amigos")
    expect(meta_content("og:url")).to eq("http://www.example.com/#{user.username}/press-kit")
    expect(document.at_css("head link[rel='canonical']")["href"]).to eq(meta_content("og:url"))
  end

  it "returns matching metadata for client navigation and after saving" do
    kit
    get "/#{user.username}/press-kit"
    expected_title = document.at_css("head title").text
    expected_image = meta_content("og:image")

    get "/#{user.username}/press-kit.json", params: { utm_source: "share" }

    expect(response.parsed_body.fetch("seo")).to include(
      "title" => "Música & amigos — Press Kit",
      "document_title" => expected_title,
      "description" => "Una noche de música en vivo.",
      "image" => expected_image,
      "url" => "http://www.example.com/#{user.username}/press-kit"
    )

    sign_in user
    patch "/#{user.username}/press-kit.json", params: {
      press_kit: { data: kit.data.merge("artistName" => "New artist").to_json }
    }

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("seo", "title")).to eq("New artist — Press Kit")
  end

  it "serves the preview image without authentication" do
    add_photo
    get "/#{user.username}/press-kit"

    get URI.parse(meta_content("og:image")).request_uri

    expect(response).to have_http_status(:redirect)
    follow_redirect!
    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq("image/png")
  end

  it "falls back to the first attached photo in the saved order for a missing or foreign cover" do
    add_photo
    first = add_photo(filename: "first-in-order.png")
    blank = kit.photos.create!(user: user)
    other_kit = create(:user).create_press_kit!(data: { published: false })
    foreign_photo = add_photo(other_kit, filename: "private.png")

    [nil, blank.id, foreign_photo.id].each do |cover_id|
      kit.update!(data: kit.data.merge("heroPhotoId" => cover_id, "photo_ids" => [blank.id, first.id]))

      get "/#{user.username}/press-kit"

      expect(meta_content("og:image")).to end_with("/first-in-order.png")
    end
  end

  it "cleans and truncates the introduction consistently across all tags" do
    kit.update!(data: kit.data.merge("bio" => { "intro" => "<p>#{'Música &amp; baile ' * 100}</p>" }))

    get "/#{user.username}/press-kit"

    expect(meta_content("description").length).to be <= 160
    expect(meta_content("description")).to start_with("Música & baile")
    expect(meta_content("description")).not_to include("<p>", "&amp;", "\n")
    expect(meta_content("og:description")).to eq(meta_content("description"))
    expect(meta_content("twitter:description")).to eq(meta_content("description"))
  end

  it "falls back to the tagline and artist name for empty legacy content" do
    kit.update!(data: kit.data.merge("artistName" => " ", "bio" => nil, "tagline" => "<b>DJ &amp; producer</b>"))

    get "/#{user.username}/press-kit"

    expect(meta_content("og:title")).to eq("#{user.display_name} — Press Kit")
    expect(meta_content("description")).to eq("DJ & producer")

    kit.update!(data: kit.data.merge("tagline" => "<p> </p>"))
    get "/#{user.username}/press-kit"

    expect(meta_content("description")).to eq(meta_content("og:title"))
  end

  it "uses the avatar when there are no press photos" do
    kit
    attach_image(user.avatar, filename: "avatar.png")

    get "/#{user.username}/press-kit"

    expect(meta_content("og:image")).to match(%r{\Ahttp://www.example.com/rails/active_storage/blobs/redirect/.+/avatar.png\z})
  end

  it "provides an absolute default image when the kit has no images" do
    kit

    get "/#{user.username}/press-kit"

    expect(meta_content("og:image")).to eq("http://www.example.com/images/default-sq3.jpg")
  end

  it "does not expose draft metadata to visitors or the owner" do
    kit.update!(data: kit.data.merge("published" => false))

    [false, true].each do |owner|
      sign_in user if owner
      get "/#{user.username}/press-kit"

      expect(response).to have_http_status(:ok)
      expect(meta_content("og:title")).to be_nil
      expect(meta_content("og:image")).to be_nil
      expect(meta_content("robots")).to include("noindex")
      expect(response.body).not_to include("Una noche de música en vivo.")

      get "/#{user.username}/press-kit.json"
      expect(response.parsed_body["seo"]).to be_nil
      expect(response.parsed_body["press_kit"].present?).to eq(owner)
    end
  end

  it "does not generate previews for artists without a kit" do
    get "/#{user.username}/press-kit"

    expect(response).to have_http_status(:ok)
    expect(meta_content("og:title")).to be_nil
    expect(meta_content("robots")).to include("noindex")
  end
end
