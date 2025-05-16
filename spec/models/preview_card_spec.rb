require "rails_helper"

RSpec.describe PreviewCard, type: :model do
  include FactoryBot::Syntax::Methods

  describe "validations" do
    it { should validate_presence_of(:url) }
  end

  describe "attachments" do
    it "can attach an image" do
      preview_card = build(:preview_card)
      preview_card.image.attach(
        io: File.open(Rails.root.join("spec/fixtures/files/sample.jpg")),
        filename: "sample.jpg",
        content_type: "image/jpeg"
      )
      expect(preview_card.image).to be_attached
    end
  end

  describe "#save_with_optional_image!" do
    it "saves successfully if valid" do
      preview_card = build(:preview_card)
      expect { preview_card.save_with_optional_image! }.to change { PreviewCard.count }.by(1)
    end
  end

  describe "#images" do
    it "returns image url if attached" do
      preview_card = create(:preview_card)
      preview_card.image.attach(
        io: File.open(Rails.root.join("spec/fixtures/files/sample.jpg")),
        filename: "sample.jpg",
        content_type: "image/jpeg"
      )
      expect(preview_card.images.first[:url]).to be_present
    end

    it "returns nil url if not attached" do
      preview_card = create(:preview_card)
      expect(preview_card.images.first[:url]).to be_nil
    end
  end

  describe "#provider_url" do
    it "returns the site for a given url" do
      preview_card = build(:preview_card, url: "https://www.example.com/page")
      expect(preview_card.provider_url).to eq("https://www.example.com")
    end
  end

  describe "#process_youtube_iframe" do
    it "modifies html for YouTube iframe" do
      html = '<iframe src="https://www.youtube.com/embed/xyz"></iframe>'
      preview_card = build(:preview_card, url: "https://www.youtube.com/watch?v=abc", html: html)
      preview_card.save
      expect(preview_card.html).to include('width="100%"')
      expect(preview_card.html).to include('height="100%"')
    end

    it "does not modify html if not YouTube" do
      html = '<iframe src="https://www.vimeo.com/embed/xyz"></iframe>'
      preview_card = build(:preview_card, url: "https://www.vimeo.com/video/abc", html: html)
      preview_card.save
      expect(preview_card.html).to eq(html)
    end
  end

  describe "#media" do
    it "returns a hash with html" do
      preview_card = build(:preview_card, html: "<div>test</div>")
      expect(preview_card.media).to eq({html: "<div>test</div>"})
    end
  end

  describe "#as_oembed_json" do
    it "returns a hash with required fields and methods" do
      preview_card = create(:preview_card, url: "https://www.example.com", title: "Title", description: "Desc", html: "<div>html</div>")
      result = preview_card.as_oembed_json
      expect(result).to include("url" => "https://www.example.com", "title" => "Title", "description" => "Desc", "html" => "<div>html</div>")
      expect(result).to have_key("provider_url")
      expect(result).to have_key("images")
      expect(result).to have_key("media")
    end
  end
end
