require "rails_helper"

RSpec.describe "Newsletter access", type: :request do
  describe "permission gating" do
    let(:user) do
      create(
        :user,
        confirmed_at: Time.current,
        username: "newsletter-user"
      )
    end

    before do
      sign_in user
    end

    it "redirects HTML requests without newsletter permission" do
      get "/newsletter/contacts"

      expect(response).to redirect_to("/")
    end

    it "returns forbidden for newsletter JSON endpoints without permission" do
      get "/newsletter/contact-lists.json"

      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body)).to include(
        "errors" => include("No tienes permiso para enviar newsletters")
      )
    end

    it "blocks email template routes without newsletter permission" do
      get "/email-templates"

      expect(response).to redirect_to("/")
    end

    it "allows newsletter pages when the user has permission" do
      user.update!(
        can_send_newsletter: true,
        newsletter_broadcast_recipient_limit: 250
      )

      get "/newsletter/contacts"

      expect(response).to have_http_status(:ok)
    end
  end
end
