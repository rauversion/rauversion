require 'rails_helper'

RSpec.describe "Messages", type: :request do
  describe "GET /create" do
    it "returns http success" do
      pending("This test is pending")
      get "/messages/create"
      expect(response).to have_http_status(:success)
    end
  end

end
