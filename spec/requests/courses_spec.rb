require 'rails_helper'

RSpec.describe "Courses", type: :request do
  describe "GET /index" do
    it "returns http success" do
      get "/courses/index"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /create" do
    it "returns http success" do
      get "/courses/create"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /destroy" do
    it "returns http success" do
      get "/courses/destroy"
      expect(response).to have_http_status(:success)
    end
  end

end
