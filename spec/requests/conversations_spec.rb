require 'rails_helper'

RSpec.describe "Conversations", type: :request do
  describe "GET /index" do
    it "returns http success" do
      get "/conversations/index"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /show" do
    it "returns http success" do
      get "/conversations/show"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /create" do
    it "returns http success" do
      get "/conversations/create"
      expect(response).to have_http_status(:success)
    end
  end

end
