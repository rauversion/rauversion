require "rails_helper"

RSpec.describe "Homes", type: :request do
  describe "GET /" do
    it "sets the locale based on the locale parameter" do
      get root_path(locale: :es)
      expect(I18n.locale).to eq(:es)
    end

    it "sets the locale based on the locale cookie if no parameter is passed" do
      cookies[:locale] = :es
      get root_path
      expect(I18n.locale).to eq(:es)
    end

    it "sets the locale to the default locale if no parameter or cookie is present" do
      get root_path
      expect(I18n.locale).to eq(I18n.default_locale)
    end

    it "stores the locale in a cookie if a parameter is passed" do
      get root_path(locale: :es)
      expect(cookies[:locale]).to eq("es")
    end
  end

  describe "GET /home/events.json" do
    let!(:user) { create(:user) }
    let!(:published_event) { create(:event, user: user, state: 'published', event_start: 1.day.from_now) }
    let!(:draft_event) { create(:event, user: user, state: 'draft', event_start: 1.day.from_now) }
    let!(:past_event) { create(:event, user: user, state: 'published', event_start: 1.day.ago) }

    it "returns published and upcoming events" do
      get "/home/events.json"
      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      expect(json_response["collection"]).to be_present
      expect(json_response["collection"].length).to eq(1)
      expect(json_response["collection"].first["id"]).to eq(published_event.id)
    end
  end
end
