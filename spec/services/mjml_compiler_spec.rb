require "rails_helper"

RSpec.describe MjmlCompiler do
  describe ".compile" do
    it "absolutizes active storage image urls in compiled html" do
      allow(Rails.application.config.action_mailer).to receive(:default_url_options).and_return({
        host: "example.com"
      })
      allow(Rails.application.routes).to receive(:default_url_options).and_return({
        host: "example.com"
      })
      allow(Rails.application.config).to receive(:force_ssl).and_return(true)

      result = described_class.compile(<<~MJML)
        <mjml>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-image src="/rails/active_storage/blobs/redirect/123/example.jpg" />
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>
      MJML

      expect(result["html"]).to include('src="https://example.com/rails/active_storage/blobs/redirect/123/example.jpg"')
    end

    it "keeps non-active-storage image urls unchanged" do
      allow(Rails.application.config.action_mailer).to receive(:default_url_options).and_return({
        host: "example.com"
      })
      allow(Rails.application.routes).to receive(:default_url_options).and_return({
        host: "example.com"
      })
      allow(Rails.application.config).to receive(:force_ssl).and_return(true)

      result = described_class.compile(<<~MJML)
        <mjml>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-image src="https://cdn.example.com/image.jpg" />
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>
      MJML

      expect(result["html"]).to include('src="https://cdn.example.com/image.jpg"')
    end
  end
end
